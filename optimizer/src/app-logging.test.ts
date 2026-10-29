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
import { createApp } from './app'
import type { optimizerLogRequest } from './logger'

const SECRET = 'shh'

const validRequest: OptimizeFileRequest = {
  stagingBucket: 'staging-bucket',
  stagingKey: 'staging/user-1/123e4567-e89b-12d3-a456-426614174000.pdf',
  destinationBucket: 'final-bucket',
  destinationKeyBase: 'user-1/223e4567-e89b-12d3-a456-426614174000',
  declaredType: 'pdf',
}

type LoggedRequest = Parameters<typeof optimizerLogRequest>[0]

/** Posts a signed `/optimize` request to an app whose optimizer answers
 * `answer`, and returns the request lines it logged. */
const logsFor = async (
  answer: () => Promise<OptimizeFileResult>
): Promise<Array<LoggedRequest>> => {
  const logged: Array<LoggedRequest> = []
  const app = createApp({
    secret: SECRET,
    optimize: answer,
    logRequest: (line) => {
      logged.push(line)
    },
  })

  const body = JSON.stringify(validRequest)
  const timestamp = String(Date.now())
  await app.request('/optimize', {
    method: 'POST',
    headers: {
      [OPTIMIZER_TIMESTAMP_HEADER]: timestamp,
      [OPTIMIZER_SIGNATURE_HEADER]: await signOptimizerRequest(
        SECRET,
        timestamp,
        body
      ),
    },
    body,
  })
  return logged
}

test('logs an accepted file as an ordinary request', async () => {
  const [line] = await logsFor(async () => ({
    ok: true,
    file: {
      fileKey: 'u/k.pdf',
      fileType: 'pdf',
      fileSizeBytes: 10,
      bucket: 'b',
    },
  }))

  assert.equal(line?.method, 'POST')
  assert.equal(line?.path, '/optimize')
  assert.equal(line?.status, 200)
  assert.equal(line?.level, undefined)
  assert.equal(line?.note, undefined)
})

test('logs a rejected file as a warning with the reason, though the status is 200', async () => {
  const [line] = await logsFor(async () => ({
    ok: false,
    reason: 'too-large',
    sizeBytes: 3_785_000,
  }))

  assert.equal(line?.status, 200)
  assert.equal(line?.level, 'warn')
  assert.equal(line?.note, 'file rejected: too-large')
})
