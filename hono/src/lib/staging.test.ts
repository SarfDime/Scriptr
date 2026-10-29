import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MAX_STORED_FILE_BYTES } from '@shared/config/shared-constants'
import type { Context } from 'hono'
import type { HonoEnv } from '../types/env.types'
import { createStagedUpload, failureResponse, parseStagingKey } from './staging'

const UUID = '123e4567-e89b-12d3-a456-426614174000'

// Presigning is local (no network): it only needs credentials to sign with.
const context = {
  env: {
    R2_ENDPOINT: 'https://account.r2.cloudflarestorage.com',
    R2_ACCESS_KEY_ID: 'key-id',
    R2_SECRET_ACCESS_KEY: 'secret',
    R2_BUCKET: 'default-bucket',
  },
} as unknown as Context<HonoEnv>

test('a staged upload is keyed under the user and signs the content type and length', async () => {
  const upload = await createStagedUpload(context, 'user-1', {
    fileType: 'pdf',
    size: 1234,
  })

  assert.match(upload.stagingKey, /^staging\/user-1\/[0-9a-f-]{36}\.pdf$/)
  assert.equal(upload.contentType, 'application/pdf')
  const url = new URL(upload.url)
  // Virtual-hosted style, like every other request the same client makes
  // (deleteR2Files has been doing this in production since before the
  // optimizer): the bucket prefix on the endpoint, not a path segment.
  assert.equal(url.hostname, 'default-bucket.account.r2.cloudflarestorage.com')
  assert.equal(
    url.pathname,
    `/staging/user-1/${upload.stagingKey.split('/')[2]}`
  )
  // R2 only enforces the declared length if it is part of the signature.
  assert.equal(
    url.searchParams.get('X-Amz-SignedHeaders'),
    'content-length;content-type;host'
  )
})

test('every staged upload gets its own key', async () => {
  const file = { fileType: 'png', size: 10 } as const
  const [first, second] = await Promise.all([
    createStagedUpload(context, 'user-1', file),
    createStagedUpload(context, 'user-1', file),
  ])

  assert.notEqual(first.stagingKey, second.stagingKey)
})

test('a staging key parses to its file type only for the user it was made for', () => {
  assert.equal(parseStagingKey(`staging/user-1/${UUID}.pdf`, 'user-1'), 'pdf')
  for (const key of [
    `staging/user-2/${UUID}.pdf`,
    `staging/user-1/${UUID}.exe`,
    `staging/user-1/nested/${UUID}.pdf`,
    `other/user-1/${UUID}.pdf`,
    'staging/user-1/x.pdf',
    '',
  ]) {
    assert.equal(parseStagingKey(key, 'user-1'), null, key)
  }
})

test('a rejection maps to a status and a message for the user', () => {
  assert.deepEqual(
    failureResponse({ ok: false, reason: 'unavailable' }).status,
    503
  )
  assert.equal(failureResponse({ ok: false, reason: 'missing' }).status, 400)
  assert.equal(failureResponse({ ok: false, reason: 'failed' }).status, 500)
})

test('a too-large message names the size reached and the limit that applied', () => {
  const scripts = failureResponse({
    ok: false,
    reason: 'too-large',
    sizeBytes: Math.round(4.2 * 1024 * 1024),
  })
  assert.equal(scripts.status, 413)
  assert.match(scripts.message, /4\.2MB/)
  assert.match(
    scripts.message,
    new RegExp(`${MAX_STORED_FILE_BYTES / 1024 / 1024}MB`)
  )

  const avatar = failureResponse(
    { ok: false, reason: 'too-large', sizeBytes: 300 * 1024 },
    200 * 1024
  )
  assert.match(avatar.message, /limit is 0\.2MB/)
})
