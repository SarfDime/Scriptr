import type {
  OptimizeFileRequest,
  OptimizeFileResult,
} from '@shared/types/file-upload.types'
import { isFileType } from '@shared/utils/api.utils'
import {
  OPTIMIZER_SIGNATURE_HEADER,
  OPTIMIZER_TIMESTAMP_HEADER,
  verifyOptimizerRequest,
} from '@shared/utils/optimizer-signature'
import { Hono } from 'hono'
import { optimizerLog, optimizerLogRequest } from './logger'

/** How long one file may take, queueing included. Kept under the API's own
 * timeout for this call (`OPTIMIZER_REQUEST_TIMEOUT_MS`, 90 s), so the service
 * gives up, and writes nothing, before the API does. */
export const OPTIMIZE_DEADLINE_MS = 80_000

const REQUEST_STRING_FIELDS = [
  'stagingBucket',
  'stagingKey',
  'destinationBucket',
  'destinationKeyBase',
] as const

const isOptimizeFileRequest = (
  value: unknown
): value is OptimizeFileRequest => {
  if (typeof value !== 'object' || value === null) return false
  const request = value as Record<string, unknown>
  return (
    REQUEST_STRING_FIELDS.every(
      (field) => typeof request[field] === 'string' && request[field] !== ''
    ) &&
    isFileType(request.declaredType) &&
    (request.purpose === undefined || request.purpose === 'avatar')
  )
}

type OptimizerEnv = {
  // biome-ignore lint/style/useNamingConvention: Hono requires this key name
  Variables: {
    /** Why the file was rejected, when it was; read by the request logger. */
    rejection?: string
  }
}

type AppOptions = {
  /** Shared with the API (`OPTIMIZER_SECRET`); signs every `/optimize` call. */
  secret: string
  optimize: (
    request: OptimizeFileRequest,
    deadline: number
  ) => Promise<OptimizeFileResult>
  /** Overridable so tests can see what gets logged. */
  logRequest?: typeof optimizerLogRequest
}

export const createApp = ({
  secret,
  optimize,
  logRequest = optimizerLogRequest,
}: AppOptions) => {
  const app = new Hono<OptimizerEnv>()

  // One line per request, like the API's. What was done to a file, and the
  // sizes, are logged by the pipeline just before this line.
  app.use('*', async (c, next) => {
    const startedAt = Date.now()
    await next()
    const rejection = c.get('rejection')
    logRequest({
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs: Date.now() - startedAt,
      // A rejected file is still answered with a 200 (the service did its job),
      // but it isn't a success, so the line is a warning that says why.
      ...(rejection
        ? { level: 'warn' as const, note: `file rejected: ${rejection}` }
        : {}),
    })
  })

  app.get('/health', (c) => c.json({ status: 'ok' }))

  app.post('/optimize', async (c) => {
    const body = await c.req.text()
    const isAuthentic = await verifyOptimizerRequest({
      secret,
      timestamp: c.req.header(OPTIMIZER_TIMESTAMP_HEADER) ?? '',
      signature: c.req.header(OPTIMIZER_SIGNATURE_HEADER) ?? '',
      body,
    })
    if (!isAuthentic) return c.json({ error: 'Unauthorized' }, 401)

    let request: unknown
    try {
      request = JSON.parse(body)
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400)
    }
    if (!isOptimizeFileRequest(request)) {
      return c.json({ error: 'Invalid request' }, 400)
    }

    // Counted from now, so time spent queued behind other files is included.
    const deadline = Date.now() + OPTIMIZE_DEADLINE_MS
    try {
      const result = await optimize(request, deadline)
      if (!result.ok) c.set('rejection', result.reason)
      return c.json<OptimizeFileResult>(result)
    } catch (error) {
      // Storage trouble, not a verdict on the file: a non-2xx status makes the
      // API treat the service as unavailable instead of blaming the upload.
      optimizerLog({
        logLevel: 'error',
        message: `Optimizing a ${request.declaredType} failed unexpectedly (${request.stagingKey})`,
        error,
      })
      return c.json({ error: 'Optimizer error' }, 500)
    }
  })

  return app
}
