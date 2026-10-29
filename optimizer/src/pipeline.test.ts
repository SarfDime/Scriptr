import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  IMMUTABLE_FILE_CACHE_CONTROL,
  MAX_STORED_FILE_BYTES,
} from '@shared/config/shared-constants'
import type { OptimizeFileRequest } from '@shared/types/file-upload.types'
import { createOptimizers } from './optimizers'
import { createOptimizeFile } from './pipeline'
import type { ObjectStorage } from './storage'

const FAR_FUTURE = Number.MAX_SAFE_INTEGER
const PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0,
])

const markdown = (text: string) => new TextEncoder().encode(text)

const request = (
  overrides: Partial<OptimizeFileRequest> = {}
): OptimizeFileRequest => ({
  stagingBucket: 'staging',
  stagingKey: 'staging/u/x.md',
  destinationBucket: 'final',
  destinationKeyBase: 'u/k',
  declaredType: 'md',
  ...overrides,
})

type StoredObject = {
  bytes: Uint8Array
  contentType?: string
  cacheControl?: string
}

/** An in-memory stand-in for R2, keyed `bucket/key`. */
const createMemoryStorage = (initial: Record<string, Uint8Array> = {}) => {
  const objects = new Map<string, StoredObject>(
    Object.entries(initial).map(([path, bytes]) => [path, { bytes }])
  )
  const calls = { reads: 0, writes: 0 }
  const storage: ObjectStorage = {
    size: async (bucket, key) =>
      objects.get(`${bucket}/${key}`)?.bytes.byteLength ?? null,
    read: async (bucket, key) => {
      calls.reads += 1
      return objects.get(`${bucket}/${key}`)?.bytes ?? null
    },
    write: async (bucket, key, bytes, options) => {
      calls.writes += 1
      objects.set(`${bucket}/${key}`, { bytes, ...options })
    },
    remove: async (bucket, key) => {
      objects.delete(`${bucket}/${key}`)
    },
  }
  return { storage, objects, calls }
}

const STAGED_MD = 'staging/staging/u/x.md'

test('stores the file under its final key and removes the staged copy', async () => {
  const { storage, objects } = createMemoryStorage({
    [STAGED_MD]: markdown('# notes'),
  })
  const optimize = createOptimizeFile({
    storage,
    optimizers: createOptimizers(),
  })

  const result = await optimize(request(), FAR_FUTURE)

  assert.deepEqual(result, {
    ok: true,
    file: {
      fileKey: 'u/k.md',
      fileType: 'md',
      fileSizeBytes: 7,
      bucket: 'final',
    },
  })
  const stored = objects.get('final/u/k.md')
  assert.equal(stored?.contentType, 'text/markdown')
  assert.equal(stored?.cacheControl, IMMUTABLE_FILE_CACHE_CONTROL)
  assert.equal(objects.has(STAGED_MD), false)
})

test('names the final key after what the optimizer produced', async () => {
  const { storage, objects } = createMemoryStorage({
    'staging/staging/u/x.png': PNG_BYTES,
  })
  const optimize = createOptimizeFile({
    storage,
    optimizers: {
      ...createOptimizers(),
      png: async () => ({
        ok: true,
        bytes: new Uint8Array(10),
        fileType: 'webp',
      }),
    },
  })

  const result = await optimize(
    request({ stagingKey: 'staging/u/x.png', declaredType: 'png' }),
    FAR_FUTURE
  )

  assert.equal(result.ok && result.file.fileKey, 'u/k.webp')
  assert.equal(objects.get('final/u/k.webp')?.contentType, 'image/webp')
})

test('reports a missing staged file', async () => {
  const { storage, calls } = createMemoryStorage()
  const optimize = createOptimizeFile({
    storage,
    optimizers: createOptimizers(),
  })

  assert.deepEqual(await optimize(request(), FAR_FUTURE), {
    ok: false,
    reason: 'missing',
  })
  assert.equal(calls.writes, 0)
})

test('rejects an oversized upload without downloading it', async () => {
  const { storage, calls } = createMemoryStorage({
    [STAGED_MD]: new Uint8Array(MAX_STORED_FILE_BYTES + 1),
  })
  const optimize = createOptimizeFile({
    storage,
    optimizers: createOptimizers(),
  })

  assert.deepEqual(await optimize(request(), FAR_FUTURE), {
    ok: false,
    reason: 'too-large',
  })
  assert.equal(calls.reads, 0)
})

test('rejects a file that is not what it claims to be', async () => {
  const { storage, calls } = createMemoryStorage({
    [STAGED_MD]: new Uint8Array([0x61, 0x00, 0x62]),
  })
  const optimize = createOptimizeFile({
    storage,
    optimizers: createOptimizers(),
  })

  assert.deepEqual(await optimize(request(), FAR_FUTURE), {
    ok: false,
    reason: 'invalid-content',
  })
  assert.equal(calls.writes, 0)
})

test('passes an optimizer rejection through and stores nothing', async () => {
  const { storage, calls } = createMemoryStorage({
    'staging/staging/u/x.png': PNG_BYTES,
  })
  const optimize = createOptimizeFile({
    storage,
    optimizers: {
      ...createOptimizers(),
      png: async () => ({ ok: false, reason: 'too-large' }),
    },
  })

  const result = await optimize(
    request({ stagingKey: 'staging/u/x.png', declaredType: 'png' }),
    FAR_FUTURE
  )

  assert.deepEqual(result, { ok: false, reason: 'too-large' })
  assert.equal(calls.writes, 0)
})

test('enforces the hard cap whatever an optimizer returns', async () => {
  const { storage, calls } = createMemoryStorage({
    'staging/staging/u/x.png': PNG_BYTES,
  })
  const optimize = createOptimizeFile({
    storage,
    optimizers: {
      ...createOptimizers(),
      png: async () => ({
        ok: true,
        bytes: new Uint8Array(MAX_STORED_FILE_BYTES + 1),
        fileType: 'webp',
      }),
    },
  })

  const result = await optimize(
    request({ stagingKey: 'staging/u/x.png', declaredType: 'png' }),
    FAR_FUTURE
  )

  assert.deepEqual(result, {
    ok: false,
    reason: 'too-large',
    sizeBytes: MAX_STORED_FILE_BYTES + 1,
  })
  assert.equal(calls.writes, 0)
})

test('passes the size an optimizer reached through with a too-large rejection', async () => {
  const { storage } = createMemoryStorage({
    'staging/staging/u/x.png': PNG_BYTES,
  })
  const optimize = createOptimizeFile({
    storage,
    optimizers: {
      ...createOptimizers(),
      png: async () => ({
        ok: false,
        reason: 'too-large',
        sizeBytes: 4_200_000,
      }),
    },
  })

  const result = await optimize(
    request({ stagingKey: 'staging/u/x.png', declaredType: 'png' }),
    FAR_FUTURE
  )

  assert.deepEqual(result, {
    ok: false,
    reason: 'too-large',
    sizeBytes: 4_200_000,
  })
})

test('writes nothing once the deadline has passed', async () => {
  const { storage, calls } = createMemoryStorage({
    [STAGED_MD]: markdown('# notes'),
  })
  const optimize = createOptimizeFile({
    storage,
    optimizers: createOptimizers(),
  })

  assert.deepEqual(await optimize(request(), 0), {
    ok: false,
    reason: 'failed',
  })
  assert.equal(calls.writes, 0)
})

test('throws when storage fails, so the API sees the service as unavailable', async () => {
  const { storage } = createMemoryStorage({ [STAGED_MD]: markdown('# notes') })
  const optimize = createOptimizeFile({
    storage: {
      ...storage,
      write: async () => {
        throw new Error('R2 is down')
      },
    },
    optimizers: createOptimizers(),
  })

  await assert.rejects(optimize(request(), FAR_FUTURE), /R2 is down/)
})

test('still succeeds when removing the staged copy fails', async () => {
  const { storage } = createMemoryStorage({ [STAGED_MD]: markdown('# notes') })
  const optimize = createOptimizeFile({
    storage: {
      ...storage,
      remove: async () => {
        throw new Error('delete failed')
      },
    },
    optimizers: createOptimizers(),
  })

  const result = await optimize(request(), FAR_FUTURE)

  assert.equal(result.ok, true)
})
