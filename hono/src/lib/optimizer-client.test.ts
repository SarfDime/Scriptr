import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  OPTIMIZER_SIGNATURE_HEADER,
  OPTIMIZER_TIMESTAMP_HEADER,
} from '@shared/config/access'
import type { OptimizeFileRequest } from '@shared/types/file-upload.types'
import { signRequest, verifyRequest } from '@shared/utils/request-signature'
import { optimizeViaService } from './optimizer-client'

const request: OptimizeFileRequest = {
  stagingBucket: 'staging-bucket',
  stagingKey: 'staging/user-1/123e4567-e89b-12d3-a456-426614174000.pdf',
  destinationBucket: 'final-bucket',
  destinationKeyBase: 'user-1/223e4567-e89b-12d3-a456-426614174000',
  declaredType: 'pdf',
}
const config = { url: 'https://optimizer.test/', secret: 'shh' }
const storedFile = {
  fileKey: 'user-1/223e4567-e89b-12d3-a456-426614174000.pdf',
  fileType: 'pdf',
  fileSizeBytes: 1234,
  bucket: 'final-bucket',
} as const

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })

test('a signature verifies, and fails for a different body, secret, or format', async () => {
  const timestamp = String(Date.now())
  const body = '{"a":1}'
  const signature = await signRequest('shh', timestamp, body)

  assert.equal(
    await verifyRequest({ secret: 'shh', timestamp, signature, body }),
    true
  )
  assert.equal(
    await verifyRequest({
      secret: 'shh',
      timestamp,
      signature,
      body: '{"a":2}',
    }),
    false
  )
  assert.equal(
    await verifyRequest({
      secret: 'other',
      timestamp,
      signature,
      body,
    }),
    false
  )
  assert.equal(
    await verifyRequest({
      secret: 'shh',
      timestamp,
      signature: 'not-hex',
      body,
    }),
    false
  )
})

test('a signed request expires, so a captured one cannot be replayed', async () => {
  const issuedAt = Date.now() - 10 * 60 * 1000
  const timestamp = String(issuedAt)
  const signature = await signRequest('shh', timestamp, 'body')

  assert.equal(
    await verifyRequest({
      secret: 'shh',
      timestamp,
      signature,
      body: 'body',
    }),
    false
  )
  assert.equal(
    await verifyRequest({
      secret: 'shh',
      timestamp,
      signature,
      body: 'body',
      now: issuedAt + 1000,
    }),
    true
  )
})

test('sends a signed request to /optimize and returns the service result', async () => {
  let seen: { url: string; headers: Headers; body: string } | undefined
  const fakeFetch: typeof fetch = async (input, init) => {
    seen = {
      url: String(input),
      headers: new Headers(init?.headers),
      body: String(init?.body),
    }
    return jsonResponse({ ok: true, file: storedFile })
  }

  const result = await optimizeViaService(config, request, fakeFetch)

  assert.deepEqual(result, { ok: true, file: storedFile })
  assert.equal(seen?.url, 'https://optimizer.test/optimize')
  assert.deepEqual(JSON.parse(seen?.body ?? ''), request)
  assert.equal(
    await verifyRequest({
      secret: 'shh',
      timestamp: seen?.headers.get(OPTIMIZER_TIMESTAMP_HEADER) ?? '',
      signature: seen?.headers.get(OPTIMIZER_SIGNATURE_HEADER) ?? '',
      body: seen?.body ?? '',
    }),
    true
  )
})

test('passes through a rejection the service decided on', async () => {
  const result = await optimizeViaService(config, request, async () =>
    jsonResponse({ ok: false, reason: 'too-large', sizeBytes: 4_200_000 })
  )
  assert.deepEqual(result, {
    ok: false,
    reason: 'too-large',
    sizeBytes: 4_200_000,
  })
})

test('treats a rejection with a malformed size as a failure', async () => {
  const result = await optimizeViaService(config, request, async () =>
    jsonResponse({ ok: false, reason: 'too-large', sizeBytes: 'big' })
  )
  assert.deepEqual(result, { ok: false, reason: 'failed' })
})

test('passes through a rejection with nothing more to say', async () => {
  const result = await optimizeViaService(config, request, async () =>
    jsonResponse({ ok: false, reason: 'too-large' })
  )
  assert.deepEqual(result, { ok: false, reason: 'too-large' })
})

test('fails closed when the service errors or cannot be reached', async () => {
  const errored = await optimizeViaService(config, request, async () =>
    jsonResponse({ error: 'boom' }, 502)
  )
  assert.deepEqual(errored, { ok: false, reason: 'unavailable' })

  const unreachable = await optimizeViaService(config, request, async () => {
    throw new TypeError('fetch failed')
  })
  assert.deepEqual(unreachable, { ok: false, reason: 'unavailable' })
})

test('treats a response it does not recognise as a failure', async () => {
  for (const body of [
    { ok: true },
    { ok: true, file: { fileKey: 'x' } },
    { ok: false, reason: 'because' },
    { ok: false, reason: 'toString' },
    'nope',
  ]) {
    const result = await optimizeViaService(config, request, async () =>
      jsonResponse(body)
    )
    assert.deepEqual(result, { ok: false, reason: 'failed' })
  }
})
