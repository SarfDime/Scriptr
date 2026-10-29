/** biome-ignore-all lint/suspicious/noConsole: <Used for logs> */

type LogLevel = 'warn' | 'info' | 'success' | 'error'

interface LogParams {
  message?: string
  logLevel: LogLevel
  error?: unknown
}

interface RequestLogParams {
  method: string
  path: string
  status: number
  durationMs: number
  /** Overrides the level that would be derived from the status. */
  level?: LogLevel
  /** Extra context shown after the duration, such as why a 200 is a warning. */
  note?: string
}

const ANSI = {
  reset: '\u001b[0m',
  blue: '\u001b[34m',
  cyan: '\u001b[36m',
  green: '\u001b[32m',
  yellow: '\u001b[33m',
  red: '\u001b[31m',
  dim: '\u001b[2m',
  bold: '\u001b[1m',
}

/**
 * Filters the stack trace to remove lines that contain specific unwanted patterns.
 * - `stack` The original stack trace.
 */
function filterStackTrace(stack: string) {
  const lines = stack.split('\n').map((line) => line.trim())

  const unwantedPatterns = ['scriptr/node_modules', 'chunks/', 'node:internal/']

  // Filter out lines that contain any unwanted pattern
  const filteredLines = lines.filter(
    (line) => !unwantedPatterns.some((pattern) => line.includes(pattern))
  )

  // Add prefix to remaining lines and join them
  return filteredLines.length > 0
    ? `\n|-| ${filteredLines.join('\n|-| ')}`
    : stack // Return original if everything was filtered out
}

function statusColor(status: number) {
  if (status >= 500) return ANSI.red
  if (status >= 400) return ANSI.yellow
  return ANSI.green
}

/**
 * Creates a logger with a project-specific identifier used in the log tag,
 * e.g. `identifier: 'API'` → `[API_SUCCESS]:`, `identifier: 'LOGGER'` → `[LOGGER_WARN]:`.
 */
function createLogger({ identifier }: { identifier: string }) {
  const tag = (level: string) =>
    `[${identifier.toUpperCase()}_${level.toUpperCase()}]: `

  const logLevelMap = {
    warn: {
      logTag: `${ANSI.yellow}${tag('warn')}${ANSI.reset}`,
      console: console.warn,
    },
    info: {
      logTag: `${ANSI.blue}${tag('info')}${ANSI.reset}`,
      console: console.info,
    },
    error: {
      logTag: `${ANSI.red}${tag('error')}${ANSI.reset}`,
      console: console.error,
    },
    success: {
      logTag: `${ANSI.green}${tag('success')}${ANSI.reset}`,
      console: console.log,
    },
  } as const

  /**
   * Logs a message with the specified log level.
   */
  function log({ message, logLevel, error }: LogParams) {
    const logMethod = logLevelMap[logLevel]
    if (error && logLevel === 'error') {
      if (error instanceof Error) {
        logMethod.console(
          `${logMethod.logTag} ${message}`,
          error.message,
          error.stack ? filterStackTrace(error.stack) : ''
        )
      } else {
        logMethod.console(`${logMethod.logTag} ${message}`, error)
      }
    } else {
      logMethod.console(`${logMethod.logTag} ${message}`)
    }
  }

  /**
   * Logs an HTTP request with method, path, status, and duration.
   * 2xx → success, 4xx → warn, 5xx → error, unless `level` says otherwise.
   */
  function logRequest({
    method,
    path,
    status,
    durationMs,
    level: forcedLevel,
    note,
  }: RequestLogParams) {
    const level: LogLevel =
      forcedLevel ??
      // biome-ignore lint/style/noNestedTernary: <Simplest way>
      (status >= 500 ? 'error' : status >= 400 ? 'warn' : 'success')
    const logMethod = logLevelMap[level]
    const color = statusColor(status)
    const suffix = note ? ` ${ANSI.dim}(${note})${ANSI.reset}` : ''

    logMethod.console(
      `${logMethod.logTag} ${ANSI.bold}${method}${ANSI.reset} ${ANSI.cyan}${path}${ANSI.reset} ${color}${status}${ANSI.reset} ${ANSI.dim}${durationMs}ms${ANSI.reset}${suffix}`
    )
  }

  return { log, logRequest }
}

export type { LogLevel }
export { createLogger }
