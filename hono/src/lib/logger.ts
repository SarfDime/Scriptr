import { createLogger } from '../../../shared/utils/logger'

const { log: honoLog, logRequest: honoLogRequest } = createLogger({
  identifier: 'API',
})

export { honoLog, honoLogRequest }
