import { createLogger } from '../../shared/utils/logger'

const { log } = createLogger({ identifier: 'LOGGER' })

/**
 * Logs a message with the specified log level.
 */
const nextLogs = (params: Parameters<typeof log>[0]) => {
  log(params)
}

export { nextLogs }
