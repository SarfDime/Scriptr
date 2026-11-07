import { Hono } from 'hono'
import { ACCESS_CODE_LENGTH } from '../../../shared/config/access'
import { createRateLimiter } from '../../../shared/utils/rate-limit'
import { InvalidSecretError, sharedAccessVerifier } from '../lib/admin-access'
import { honoLog } from '../lib/logger'
import { isAllowedOrigin } from '../lib/origin'
import {
  clientIp,
  exceedsBodyLimit,
  MAX_JSON_BODY_BYTES,
  readJsonBody,
} from '../lib/request'
import type { HonoEnv } from '../types/env.types'
import academic from './sanity-academic'

/**
 * Everything the Sanity Studio calls, and nothing else.
 *
 * This surface is deliberately separate from the website's routes: the Studio
 * is a browser app whose bundle is public, so it cannot hold a credential.
 * `POST /access` trades a TOTP code for a twenty-minute token, every other route
 * requires that token, and the surface is pinned to the Studio's origin
 * (`SANITY_STUDIO_ORIGIN`) in production.
 */
const sanity = new Hono<HonoEnv>()

/** Six digits is a small space, so code entry is the one route that has to be
 * throttled hard. Attempts over the limit still count, so hammering keeps the
 * block in place. */
const codeAttemptLimiter = createRateLimiter({
  limit: 5,
  windowMs: 15 * 60 * 1000,
  countBlocked: true,
})

const CODE_PATTERN = new RegExp(`^\\d{${ACCESS_CODE_LENGTH}}$`)

sanity.use('*', async (c, next) => {
  if (!isAllowedOrigin(c, c.env.SANITY_STUDIO_ORIGIN)) {
    honoLog({
      logLevel: 'warn',
      message: `Rejected ${c.req.method} ${c.req.path} from origin ${c.req.header('origin') ?? '(none)'}.`,
    })
    return c.json({ error: 'Forbidden' }, 403)
  }

  return next()
})

/** Exchange a TOTP code for a twenty-minute access token. */
sanity.post('/access', async (c) => {
  if (codeAttemptLimiter(`access:${clientIp(c)}`)) {
    return c.json(
      { error: 'Too many access code attempts. Please wait a few minutes.' },
      429
    )
  }

  const secret = c.env.ADMIN_TOTP_SECRET
  if (!secret) {
    honoLog({
      logLevel: 'error',
      message: 'ADMIN_TOTP_SECRET is not set; Studio access is unavailable.',
    })
    return c.json({ error: 'Studio access is not configured' }, 503)
  }

  if (await exceedsBodyLimit(c, MAX_JSON_BODY_BYTES)) {
    return c.json({ error: 'Request body is too large' }, 413)
  }

  const body = await readJsonBody(c)
  const code = typeof body.code === 'string' ? body.code.trim() : ''
  if (!CODE_PATTERN.test(code)) {
    return c.json({ error: 'Enter the six-digit code' }, 400)
  }

  try {
    const verifier = sharedAccessVerifier(secret)
    if (!verifier.verifyCode(code)) {
      return c.json({ error: 'That code is not valid. Try the next one.' }, 401)
    }
    return c.json(verifier.issueToken())
  } catch (error) {
    if (!(error instanceof InvalidSecretError)) throw error
    honoLog({
      logLevel: 'error',
      message: `ADMIN_TOTP_SECRET is unusable: ${error.message}`,
    })
    return c.json({ error: 'Studio access is not configured' }, 503)
  }
})

sanity.route('/', academic)

export default sanity
