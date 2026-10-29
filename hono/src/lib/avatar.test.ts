import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Context } from 'hono'
import type { HonoEnv } from '../types/env.types'
import {
  avatarKey,
  avatarKeyBase,
  buildAvatarUrl,
  removeAvatarObject,
} from './avatar'

const USER = '123e4567-e89b-12d3-a456-426614174000'
const BASE = 'https://files.example.com'

// No R2 calls: `removeAvatarObject` takes its deleter, as `createStagedUpload`
// takes its client.
const context = {
  env: { R2_BUCKET: 'scriptr' },
} as unknown as Context<HonoEnv>

type DeletedFile = { bucket: string; fileKey: string }
const recordingDeleter = () => {
  const calls: Array<ReadonlyArray<DeletedFile>> = []
  const remove = async (_c: unknown, files: ReadonlyArray<DeletedFile>) => {
    calls.push(files)
  }
  return {
    calls,
    remove: remove as unknown as Parameters<typeof removeAvatarObject>[2],
  }
}

test('an avatar lives at one key per user, next to the script files', () => {
  assert.equal(avatarKey(USER), `avatars/${USER}.webp`)
  // What the optimizer gets: it appends the stored type.
  assert.equal(avatarKeyBase(USER), `avatars/${USER}`)
  assert.equal(`${avatarKeyBase(USER)}.webp`, avatarKey(USER))
})

test('the public URL points at that key, and carries the version', () => {
  assert.equal(
    buildAvatarUrl(BASE, USER, 'abc'),
    `${BASE}/avatars/${USER}.webp?v=abc`
  )
  // A trailing slash on the configured domain must not double up.
  assert.equal(
    buildAvatarUrl(`${BASE}//`, USER, 'abc'),
    `${BASE}/avatars/${USER}.webp?v=abc`
  )
})

test('each upload gets a different URL, because the key is the same one', () => {
  const first = buildAvatarUrl(BASE, USER, 'aaa')
  const second = buildAvatarUrl(BASE, USER, 'bbb')
  assert.notEqual(first, second)
  // Only the version differs: same object.
  assert.equal(first.split('?')[0], second.split('?')[0])
})

test('deleting the account removes exactly its own avatar object', async () => {
  const { calls, remove } = recordingDeleter()

  await removeAvatarObject(context, USER, remove)

  assert.deepEqual(calls, [
    [{ bucket: 'scriptr', fileKey: `avatars/${USER}.webp` }],
  ])
})

test('a failed delete is logged, not thrown', async () => {
  const failing = (async () => {
    throw new Error('R2 is down')
  }) as unknown as Parameters<typeof removeAvatarObject>[2]

  await removeAvatarObject(context, USER, failing)
})
