/** biome-ignore-all lint/suspicious/noConsole: <Used for logs> */

type LogLevel = 'warn' | 'info' | 'success' | 'error'

interface LogServerlessParams {
  message?: string
  logLevel: LogLevel
  error?: unknown
  skipSentry?: boolean
}

const ANSI = {
  reset: '\u001b[0m',
  blue: '\u001b[34m',
  green: '\u001b[32m',
  yellow: '\u001b[33m',
  red: '\u001b[31m',
}

const logLevelMap = {
  warn: {
    logTag: `${ANSI.blue}›LOGGER_WARN: ${ANSI.reset}`,
    console: console.warn,
  },
  info: {
    logTag: `${ANSI.blue}›LOGGER_INFO: ${ANSI.reset}`,
    console: console.info,
  },
  error: {
    logTag: `${ANSI.blue}›LOGGER_ERROR: ${ANSI.reset}`,
    console: console.error,
  },
  success: {
    logTag: `${ANSI.blue}›LOGGER_SUCCESS: ${ANSI.reset}`,
    console: console.log,
  },
} as const

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

/**
 * Logs a message with the specified log level.
 */
function logServerless({ message, logLevel, error }: LogServerlessParams) {
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

export { logServerless }
