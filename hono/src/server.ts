import { serve } from '@hono/node-server'
import { app } from './index'
import { honoLog } from './lib/logger'

const port = Number(process.env.PORT) || 8787
const env = process.env.NODE_ENV || 'development'

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    honoLog({
      logLevel: 'success',
      message: `Faculty Scripts API started on http://localhost:${info.port} [${env}]`,
    })
  }
)
