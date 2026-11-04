import {
  OPTIMIZER_SIGNATURE_HEADER,
  OPTIMIZER_TIMESTAMP_HEADER,
} from '@shared/config/access'
import type {
  OptimizeFileFailureReason,
  OptimizeFileRequest,
  OptimizeFileResult,
} from '@shared/types/file-upload.types'
import { isScriptFileInput } from '@shared/utils/api.utils'
import { signRequest } from '@shared/utils/request-signature'
import { honoLog } from './logger'

/** Kept below the web client's finalize timeout (`UPLOAD_FINALIZE_TIMEOUT_MS`)
 * so the user gets our error rather than a client-side abort. */
export const OPTIMIZER_REQUEST_TIMEOUT_MS = 90_000

export type OptimizerConfig = {
  url: string
  secret: string
}

// Exhaustive on purpose: a new failure reason must be added here too.
const FAILURE_REASONS: Record<OptimizeFileFailureReason, true> = {
  'invalid-content': true,
  missing: true,
  'too-large': true,
  failed: true,
  unavailable: true,
}

const isOptimizeFileResult = (value: unknown): value is OptimizeFileResult => {
  if (typeof value !== 'object' || value === null) return false
  const result = value as Record<string, unknown>
  if (result.ok === true) return isScriptFileInput(result.file)
  return (
    result.ok === false &&
    typeof result.reason === 'string' &&
    Object.hasOwn(FAILURE_REASONS, result.reason) &&
    (result.sizeBytes === undefined || typeof result.sizeBytes === 'number')
  )
}

/**
 * Asks the optimizer service to optimize one staged file. The service answers
 * `200` with an `OptimizeFileResult` for anything it decided about the file
 * itself (including rejections); any other status, or no answer at all, means
 * the service is unavailable.
 *
 * Fails closed: it never falls back to storing the file unoptimized.
 */
export const optimizeViaService = async (
  { url, secret }: OptimizerConfig,
  request: OptimizeFileRequest,
  fetchImpl: typeof fetch = fetch
): Promise<OptimizeFileResult> => {
  const body = JSON.stringify(request)
  const timestamp = String(Date.now())

  try {
    const response = await fetchImpl(`${url.replace(/\/+$/, '')}/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [OPTIMIZER_TIMESTAMP_HEADER]: timestamp,
        [OPTIMIZER_SIGNATURE_HEADER]: await signRequest(
          secret,
          timestamp,
          body
        ),
      },
      body,
      signal: AbortSignal.timeout(OPTIMIZER_REQUEST_TIMEOUT_MS),
    })

    if (!response.ok) {
      honoLog({
        logLevel: 'error',
        message: 'File optimizer returned an error status',
        error: new Error(`HTTP ${response.status}`),
      })
      return { ok: false, reason: 'unavailable' }
    }

    const result: unknown = await response.json()
    return isOptimizeFileResult(result)
      ? result
      : { ok: false, reason: 'failed' }
  } catch (error) {
    honoLog({
      logLevel: 'error',
      message: 'File optimizer is unreachable',
      error,
    })
    return { ok: false, reason: 'unavailable' }
  }
}
