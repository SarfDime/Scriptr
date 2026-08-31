import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handle } from 'hono/vercel'
import auth from './routes/auth'
import comments from './routes/comments'
import faculties from './routes/faculties'
import fileOps from './routes/file-ops'
import flags from './routes/flags'
import internal from './routes/internal'
import professors from './routes/professors'
import profiles from './routes/profiles'
import scripts from './routes/scripts'
import subjects from './routes/subjects'
import universities from './routes/universities'
import votes from './routes/votes'
import type { HonoEnv } from './types/env.types'

export const app = new Hono<HonoEnv>()

app.use('*', async (c, next) => {
  c.env = process.env as unknown as HonoEnv['Bindings']
  await next()
})

app.use(
  '*',
  cors({
    origin: [
      'https://your-vercel-app.vercel.app',
      'http://localhost:3000',
      'http://localhost:5173',
    ],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'X-Client-Info',
      'X-Internal-Secret',
    ],
    exposeHeaders: ['Content-Length', 'X-Request-Id'],
    credentials: true,
    maxAge: 86400,
  })
)

app.route('/api/auth', auth)
app.route('/api/universities', universities)
app.route('/api/faculties', faculties)
app.route('/api/professors', professors)
app.route('/api/subjects', subjects)
app.route('/api/file-ops', fileOps)
app.route('/api/scripts', scripts)
app.route('/api/votes', votes)
app.route('/api/comments', comments)
app.route('/api/flags', flags)
app.route('/api/profiles', profiles)
app.route('/api/internal', internal)

app.get('/', (c) =>
  c.json({
    status: 'ok',
    service: 'Faculty Scripts API',
    version: '1.0.0',
  })
)

app.onError((err, c) => {
  return c.json(
    {
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    },
    500
  )
})

app.notFound((c) => {
  return c.json({ error: 'Route not found' }, 404)
})

export type AppType = typeof app

export default handle(app)
