import { Hono, type MiddlewareHandler } from 'hono'
import { ACCESS_CODE_LENGTH } from '../../../shared/config/access'
import type { AccessTokenResponse } from '../../../shared/types/access.types'
import { createRateLimiter } from '../../../shared/utils/rate-limit'
import {
  accessTokenFailure,
  InvalidSecretError,
  setAccessCookie,
  sharedAccessVerifier,
} from '../lib/admin-access'
import { honoLog } from '../lib/logger'
import { isAllowedOrigin } from '../lib/origin'
import {
  clientIp,
  exceedsBodyLimit,
  MAX_JSON_BODY_BYTES,
  readJsonBody,
} from '../lib/request'
import type { HonoEnv } from '../types/env.types'
import protectedAdmin from './admin-protected'

/**
 * The website's admin surface.
 *
 * Separate from `/api/sanity/*` on purpose: this one is only reachable from the
 * site (`WEBSITE_ORIGIN`) and only after an operator unlocks it with a TOTP
 * code, which is stored as an HttpOnly cookie so server-rendered pages can use
 * it. Routes that change something live in `./admin-protected.ts`.
 */
const admin = new Hono<HonoEnv>()

/** Six digits is a small space, so code entry is the one route that has to be
 * throttled hard. Attempts over the limit still count, so hammering keeps the
 * block in place. */
const codeAttemptLimiter = createRateLimiter({
  limit: 5,
  windowMs: 15 * 60 * 1000,
  countBlocked: true,
})

const CODE_PATTERN = new RegExp(`^\\d{${ACCESS_CODE_LENGTH}}$`)

/** Pins a route to `WEBSITE_ORIGIN`.
 *
 * `allowMissing` separates the two callers: the code exchange only ever comes
 * from the browser (which always sends an `Origin`), while the layout's status
 * probe runs from the Next server, where no `Origin` exists — rejecting that
 * one would lock every admin page out in production. Protected routes handle
 * this themselves through `requireAdminAccess`. */
const siteOrigin =
  (allowMissing: boolean): MiddlewareHandler<HonoEnv> =>
  async (c, next) => {
    if (!isAllowedOrigin(c, c.env.WEBSITE_ORIGIN, { allowMissing })) {
      honoLog({
        logLevel: 'warn',
        message: `Rejected ${c.req.method} ${c.req.path} from origin ${c.req.header('origin') ?? '(none)'}.`,
      })
      return c.json({ error: 'Forbidden' }, 403)
    }

    return next()
  }

/** Reports whether the caller currently holds a live unlock. The admin layout
 * calls this before rendering, so an expired cookie shows the unlock form
 * instead of a page of failed requests. */
admin.get('/access', siteOrigin(true), (c) => {
  const failure = accessTokenFailure(c)
  if (failure) return failure

  return c.json({ unlocked: true })
})

/** Unlock admin actions for ten minutes: sets the cookie the site relies on and
 * returns the same token for scripted callers. */
admin.post('/access', siteOrigin(false), async (c) => {
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
      message: 'ADMIN_TOTP_SECRET is not set; admin access is unavailable.',
    })
    return c.json({ error: 'Admin access is not configured' }, 503)
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

    const issued = verifier.issueToken()
    setAccessCookie(c, issued.token)
    return c.json<AccessTokenResponse>(issued)
  } catch (error) {
    if (!(error instanceof InvalidSecretError)) throw error
    honoLog({
      logLevel: 'error',
      message: `ADMIN_TOTP_SECRET is unusable: ${error.message}`,
    })
    return c.json({ error: 'Admin access is not configured' }, 503)
  }
})

admin.route('/', protectedAdmin)

export default admin
