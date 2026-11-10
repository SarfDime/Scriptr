import { Hono } from 'hono'
import { cors } from 'hono/cors'
import {
  ACCESS_TOKEN_HEADER,
  SITEMAP_SECRET_HEADER,
} from '../../shared/config/access'
/// <reference path="./sanity-stub.d.ts" />

import { getRequestListener } from '@hono/node-server'
import { resolveCorsOrigin } from './lib/cors'
import { honoLog, honoLogRequest } from './lib/logger'
import achievementDefinitions from './routes/achievement-definitions'
import admin from './routes/admin'
import auth from './routes/auth'
import calendarNotes from './routes/calendar-notes'
import comments from './routes/comments'
import downloadReview from './routes/download-review'
import favorites from './routes/favorites'
import fileOps from './routes/file-ops'
import flags from './routes/flags'
import notifications from './routes/notifications'
import profileFaculties from './routes/profile-faculties'
import profileStudies from './routes/profile-studies'
import profileSubjects from './routes/profile-subjects'
import profiles from './routes/profiles'
import ratings from './routes/ratings'
import restrictions from './routes/restrictions'
import sanity from './routes/sanity'
import scripts from './routes/scripts'
import sitemap from './routes/sitemap'
import votes from './routes/votes'
import type { HonoEnv } from './types/env.types'

export const app = new Hono<HonoEnv>().basePath('/api')

app.use('*', async (c, next) => {
  c.env = process.env as unknown as HonoEnv['Bindings']
  await next()
})

app.use('*', async (c, next) => {
  const startedAt = Date.now()
  await next()

  honoLogRequest({
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    durationMs: Date.now() - startedAt,
  })
})

app.use(
  '*',
  cors({
    origin: (origin) => resolveCorsOrigin(origin),
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'X-Client-Info',
      'X-Device-Id',
      SITEMAP_SECRET_HEADER,
      ACCESS_TOKEN_HEADER,
    ],
    exposeHeaders: ['Content-Length', 'X-Request-Id'],
    credentials: true,
    maxAge: 86400,
  })
)

app.route('/auth', auth)
app.route('/sanity', sanity)
app.route('/admin', admin)
app.route('/sitemap', sitemap)
app.route('/file-ops', fileOps)
app.route('/scripts', scripts)
app.route('/votes', votes)
app.route('/comments', comments)
app.route('/flags', flags)
app.route('/favorites', favorites)
app.route('/profiles', profiles)
app.route('/calendar-notes', calendarNotes)
app.route('/profile-subjects', profileSubjects)
app.route('/profile-studies', profileStudies)
app.route('/profile-faculties', profileFaculties)
app.route('/notifications', notifications)
app.route('/ratings', ratings)
app.route('/achievement-definitions', achievementDefinitions)
app.route('/restrictions', restrictions)
app.route('/download-review', downloadReview)

app.get('/', (c) =>
  c.json({
    status: 'ok',
    service: 'Faculty Scripts API',
    version: '1.0.0',
  })
)

app.onError((err, c) => {
  honoLog({
    message: `Unhandled error on ${c.req.method} ${c.req.path}`,
    logLevel: 'error',
    error: err,
  })

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

export default getRequestListener(app.fetch)
