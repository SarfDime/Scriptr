import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  AVATAR_MAX_STORED_BYTES,
  AVATAR_MAX_UPLOAD_BYTES,
} from '@shared/config/avatar'
import type { OptimizeFileRequest } from '@shared/types/file-upload.types'
import { createOptimizers } from './optimizers'
import { createOptimizeFile } from './pipeline'
import type { ObjectStorage } from './storage'
import type { FileOptimizer } from './types'

const FAR_FUTURE = Number.MAX_SAFE_INTEGER
const PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0,
])
const STAGED = 'staging/staging/u/x.png'

const request = (
  overrides: Partial<OptimizeFileRequest> = {}
): OptimizeFileRequest => ({
  stagingBucket: 'staging',
  stagingKey: 'staging/u/x.png',
  destinationBucket: 'avatars',
  destinationKeyBase: 'u/k',
  declaredType: 'png',
  purpose: 'avatar',
  ...overrides,
})

const createMemoryStorage = (initial: Record<string, Uint8Array>) => {
  const objects = new Map(Object.entries(initial))
  const calls = { reads: 0, writes: 0 }
  const storage: ObjectStorage = {
    size: async (bucket, key) =>
      objects.get(`${bucket}/${key}`)?.byteLength ?? null,
    read: async (bucket, key) => {
      calls.reads += 1
      return objects.get(`${bucket}/${key}`) ?? null
    },
    write: async (bucket, key, bytes) => {
      calls.writes += 1
      objects.set(`${bucket}/${key}`, bytes)
    },
    remove: async (bucket, key) => {
      objects.delete(`${bucket}/${key}`)
    },
  }
  return { storage, objects, calls }
}

const webp =
  (size: number): FileOptimizer =>
  async () => ({
    ok: true,
    bytes: new Uint8Array(size),
    fileType: 'webp',
  })

test('an avatar goes through the avatar optimizer and is stored as webp in the destination bucket', async () => {
  const { storage, objects } = createMemoryStorage({ [STAGED]: PNG_BYTES })
  const optimize = createOptimizeFile({
    storage,
    optimizers: createOptimizers(),
    avatarOptimizer: webp(5000),
  })

  const result = await optimize(request(), FAR_FUTURE)

  assert.equal(result.ok && result.file.fileKey, 'u/k.webp')
  assert.equal(result.ok && result.file.fileType, 'webp')
  assert.equal(objects.get('avatars/u/k.webp')?.byteLength, 5000)
  assert.equal(objects.has(STAGED), false)
})

test('an avatar is held to the avatar cap, not the script file one', async () => {
  const { storage, calls } = createMemoryStorage({ [STAGED]: PNG_BYTES })
  const optimize = createOptimizeFile({
    storage,
    optimizers: createOptimizers(),
    avatarOptimizer: webp(AVATAR_MAX_STORED_BYTES + 1),
  })

  const result = await optimize(request(), FAR_FUTURE)

  assert.deepEqual(result, {
    ok: false,
    reason: 'too-large',
    sizeBytes: AVATAR_MAX_STORED_BYTES + 1,
  })
  assert.equal(calls.writes, 0)
})

test('an avatar accepts only image types, without reading the file', async () => {
  const { storage, calls } = createMemoryStorage({
    'staging/staging/u/x.pdf': new TextEncoder().encode('%PDF-1.7'),
  })
  const optimize = createOptimizeFile({
    storage,
    optimizers: createOptimizers(),
    avatarOptimizer: webp(10),
  })

  const result = await optimize(
    request({ stagingKey: 'staging/u/x.pdf', declaredType: 'pdf' }),
    FAR_FUTURE
  )

  assert.deepEqual(result, { ok: false, reason: 'invalid-content' })
  assert.equal(calls.reads, 0)
})

test('an avatar upload over the avatar limit is rejected without downloading it', async () => {
  const { storage, calls } = createMemoryStorage({
    [STAGED]: new Uint8Array(AVATAR_MAX_UPLOAD_BYTES + 1),
  })
  const optimize = createOptimizeFile({
    storage,
    optimizers: createOptimizers(),
    avatarOptimizer: webp(10),
  })

  const result = await optimize(request(), FAR_FUTURE)

  assert.deepEqual(result, { ok: false, reason: 'too-large' })
  assert.equal(calls.reads, 0)
})

test('a file with no purpose still uses its own optimizer, not the avatar one', async () => {
  const { storage, objects } = createMemoryStorage({ [STAGED]: PNG_BYTES })
  const optimize = createOptimizeFile({
    storage,
    optimizers: { ...createOptimizers(), png: webp(7) },
    avatarOptimizer: webp(5000),
  })

  const result = await optimize(
    request({ purpose: undefined, destinationBucket: 'files' }),
    FAR_FUTURE
  )

  assert.equal(result.ok, true)
  assert.equal(objects.get('files/u/k.webp')?.byteLength, 7)
})
