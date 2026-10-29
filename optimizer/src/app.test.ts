import assert from 'node:assert/strict'
import { test } from 'node:test'
import type {
  OptimizeFileRequest,
  OptimizeFileResult,
} from '@shared/types/file-upload.types'
import {
  OPTIMIZER_SIGNATURE_HEADER,
  OPTIMIZER_TIMESTAMP_HEADER,
  signOptimizerRequest,
} from '@shared/utils/optimizer-signature'
import { createApp, OPTIMIZE_DEADLINE_MS } from './app'

const SECRET = 'shh'

const validRequest: OptimizeFileRequest = {
  stagingBucket: 'staging-bucket',
  stagingKey: 'staging/user-1/123e4567-e89b-12d3-a456-426614174000.pdf',
  destinationBucket: 'final-bucket',
  destinationKeyBase: 'user-1/223e4567-e89b-12d3-a456-426614174000',
  declaredType: 'pdf',
}

const storedFile: OptimizeFileResult = {
  ok: true,
  file: {
    fileKey: 'user-1/223e4567-e89b-12d3-a456-426614174000.pdf',
    fileType: 'pdf',
    fileSizeBytes: 1234,
    bucket: 'final-bucket',
  },
}

/** An app whose optimizer records what it was asked and answers with `answer`. */
const createTestApp = (
  answer: () => Promise<OptimizeFileResult> = async () => storedFile
) => {
  const seen: Array<{ request: OptimizeFileRequest; deadline: number }> = []
  const app = createApp({
    secret: SECRET,
    optimize: async (request, deadline) => {
      seen.push({ request, deadline })
      return answer()
    },
  })
  return { app, seen }
}

const post = async (
  app: ReturnType<typeof createApp>,
  body: string,
  secret = SECRET
) => {
  const timestamp = String(Date.now())
  return app.request('/optimize', {
    method: 'POST',
    headers: {
      [OPTIMIZER_TIMESTAMP_HEADER]: timestamp,
      [OPTIMIZER_SIGNATURE_HEADER]: await signOptimizerRequest(
        secret,
        timestamp,
        body
      ),
    },
    body,
  })
}

test('GET /health reports ok', async () => {
  const { app } = createTestApp()
  const response = await app.request('/health')
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { status: 'ok' })
})

test('POST /optimize rejects an unsigned request without optimizing', async () => {
  const { app, seen } = createTestApp()
  const response = await app.request('/optimize', {
    method: 'POST',
    body: JSON.stringify(validRequest),
  })
  assert.equal(response.status, 401)
  assert.equal(seen.length, 0)
})

test('POST /optimize rejects a request signed with the wrong secret', async () => {
  const { app, seen } = createTestApp()
  const response = await post(app, JSON.stringify(validRequest), 'other-secret')
  assert.equal(response.status, 401)
  assert.equal(seen.length, 0)
})

test('POST /optimize rejects a signed body that is not JSON', async () => {
  const { app } = createTestApp()
  const response = await post(app, 'not json')
  assert.equal(response.status, 400)
})

test('POST /optimize rejects a signed body with the wrong shape', async () => {
  const { app, seen } = createTestApp()
  for (const body of [
    {},
    { ...validRequest, declaredType: 'doc' },
    { ...validRequest, stagingKey: '' },
    { ...validRequest, destinationBucket: 5 },
  ]) {
    const response = await post(app, JSON.stringify(body))
    assert.equal(response.status, 400, JSON.stringify(body))
  }
  assert.equal(seen.length, 0)
})

test('POST /optimize passes the request on with a deadline and returns the result', async () => {
  const { app, seen } = createTestApp()
  const before = Date.now()

  const response = await post(app, JSON.stringify(validRequest))

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), storedFile)
  assert.deepEqual(seen[0]?.request, validRequest)
  const deadline = seen[0]?.deadline ?? 0
  assert.ok(deadline >= before + OPTIMIZE_DEADLINE_MS)
  assert.ok(deadline <= Date.now() + OPTIMIZE_DEADLINE_MS)
})

test('POST /optimize returns a rejection as a 200 verdict on the file', async () => {
  const { app } = createTestApp(async () => ({
    ok: false,
    reason: 'too-large',
  }))

  const response = await post(app, JSON.stringify(validRequest))

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { ok: false, reason: 'too-large' })
})

test('POST /optimize answers 500 when optimizing throws, so the API reads it as unavailable', async () => {
  const { app } = createTestApp(async () => {
    throw new Error('R2 is down')
  })

  const response = await post(app, JSON.stringify(validRequest))

  assert.equal(response.status, 500)
})
