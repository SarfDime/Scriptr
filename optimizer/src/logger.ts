import { createLogger } from '@shared/utils/logger'

const { log: optimizerLog, logRequest: optimizerLogRequest } = createLogger({
  identifier: 'OPTIMIZER',
})

export { optimizerLog, optimizerLogRequest }
