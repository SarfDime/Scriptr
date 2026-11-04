import { createHmac, randomBytes } from 'node:crypto'
import type { Context, MiddlewareHandler } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import {
  ACCESS_CODE_LENGTH,
  ACCESS_CODE_STEP_SECONDS,
  ACCESS_TOKEN_HEADER,
  ACCESS_TOKEN_TTL_MS,
  ADMIN_ACCESS_COOKIE,
} from '../../../shared/config/access'
import type { HonoEnv } from '../types/env.types'
import { honoLog } from './logger'
import { isAllowedOrigin } from './origin'
import { matchesSecret } from './secret'

/**
 * Access control for the admin surface the Sanity Studio calls.
 *
 * The Studio runs in a browser, so anything it is given is public: the old
 * shared header secret was inlined into its bundle by Vite and could be read by
 * anyone who loaded the Studio. Instead the operator proves possession of a
 * TOTP secret that only the API holds, and exchanges a code for a signed token
 * that expires in ten minutes.
 */

const TOTP_STEP_SECONDS = ACCESS_CODE_STEP_SECONDS
const TOTP_DIGITS = ACCESS_CODE_LENGTH
/** Codes from the previous and next step are accepted, absorbing clock drift. */
const TOTP_WINDOW_STEPS = 1
const TOKEN_VERSION = 'v1'
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
/** Domain separation: the token signing key is derived from the TOTP secret
 * rather than being the TOTP secret itself. */
const TOKEN_KEY_LABEL = 'scriptr-admin-access-token'

export class InvalidSecretError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidSecretError'
  }
}

/** Decodes a base32 secret (RFC 4648, no padding) into its HMAC key. */
export function decodeBase32(value: string): Buffer {
  const normalized = value.trim().replace(/=+$/, '').toUpperCase()
  if (normalized.length === 0) {
    throw new InvalidSecretError('The TOTP secret is empty.')
  }

  let bits = 0
  let accumulator = 0
  const bytes: Array<number> = []

  for (const character of normalized) {
    const index = BASE32_ALPHABET.indexOf(character)
    if (index === -1) {
      throw new InvalidSecretError('The TOTP secret is not valid base32.')
    }
    accumulator = (accumulator << 5) | index
    bits += 5
    if (bits >= 8) {
      bits -= 8
      bytes.push((accumulator >>> bits) & 0xff)
    }
  }

  if (bytes.length === 0) {
    throw new InvalidSecretError('The TOTP secret is too short.')
  }

  return Buffer.from(bytes)
}

/** Encodes raw key bytes as an unpadded base32 secret. */
export function encodeBase32(key: Buffer): string {
  let bits = 0
  let accumulator = 0
  let encoded = ''

  for (const byte of key) {
    accumulator = (accumulator << 8) | byte
    bits += 8
    while (bits >= 5) {
      bits -= 5
      encoded += BASE32_ALPHABET[(accumulator >>> bits) & 0x1f]
    }
  }

  if (bits > 0) {
    encoded += BASE32_ALPHABET[(accumulator << (5 - bits)) & 0x1f]
  }

  return encoded
}

/** A fresh 160-bit secret, the size RFC 4226 recommends for HMAC-SHA1. */
export const generateTotpSecret = (): string => encodeBase32(randomBytes(20))

/** The `otpauth://` URI an authenticator app enrols from. */
export function totpUri({
  secret,
  account,
  issuer = 'Scriptr',
}: {
  secret: string
  account: string
  issuer?: string
}): string {
  const label = encodeURIComponent(`${issuer}:${account}`)
  const params = new URLSearchParams({
    secret: secret.replace(/\s+/g, '').toUpperCase(),
    issuer,
    algorithm: 'SHA1',
    digits: String(TOTP_DIGITS),
    period: String(TOTP_STEP_SECONDS),
  })

  return `otpauth://totp/${label}?${params.toString()}`
}

const hotp = (key: Buffer, counter: number): string => {
  const message = Buffer.alloc(8)
  message.writeUInt32BE(Math.floor(counter / 2 ** 32), 0)
  message.writeUInt32BE(counter >>> 0, 4)

  const digest = createHmac('sha1', key).update(message).digest()
  const offset = (digest.at(-1) ?? 0) & 0x0f
  // The dynamic-truncation offset is 4 bytes from `offset`; multiplying rather
  // than shifting keeps the value a positive 31-bit integer.
  const slice = digest.subarray(offset, offset + 4)
  const binary =
    ((slice[0] ?? 0) & 0x7f) * 0x1000000 +
    ((slice[1] ?? 0) & 0xff) * 0x10000 +
    ((slice[2] ?? 0) & 0xff) * 0x100 +
    ((slice[3] ?? 0) & 0xff)

  return (binary % 10 ** TOTP_DIGITS).toString().padStart(TOTP_DIGITS, '0')
}

const tokenKey = (secret: Buffer): Buffer =>
  createHmac('sha256', secret).update(TOKEN_KEY_LABEL).digest()

const signToken = (expiresAtSeconds: number, key: Buffer): string =>
  createHmac('sha256', key)
    .update(`${TOKEN_VERSION}.${expiresAtSeconds}`)
    .digest('base64url')

type AccessVerifierOptions = {
  /** Base32 TOTP secret from the environment. */
  secret: string
  now?: () => number
}

/**
 * Verifies access codes against the TOTP secret and remembers the last step it
 * accepted, so a code observed on the wire cannot be replayed for the rest of
 * its 90-second window.
 */
export function createAccessVerifier({
  secret,
  now = Date.now,
}: AccessVerifierOptions) {
  const key = decodeBase32(secret)
  const signingKey = tokenKey(key)
  let lastAcceptedStep = -1

  const currentStep = () => Math.floor(now() / 1000 / TOTP_STEP_SECONDS)

  return {
    /** True when `code` matches the current or an adjacent step. */
    verifyCode(code: string): boolean {
      if (!/^\d{6}$/.test(code)) return false

      const step = currentStep()
      for (
        let offset = -TOTP_WINDOW_STEPS;
        offset <= TOTP_WINDOW_STEPS;
        offset += 1
      ) {
        const candidateStep = step + offset
        if (candidateStep <= lastAcceptedStep) continue
        if (!matchesSecret(hotp(key, candidateStep), code)) continue
        lastAcceptedStep = candidateStep
        return true
      }

      return false
    },

    /** A signed `v1.<expiresAt>.<signature>` token, valid for ten minutes. */
    issueToken(): { token: string; expiresAt: number } {
      const expiresAt = now() + ACCESS_TOKEN_TTL_MS
      const expiresAtSeconds = Math.floor(expiresAt / 1000)
      return {
        token: `${TOKEN_VERSION}.${expiresAtSeconds}.${signToken(expiresAtSeconds, signingKey)}`,
        expiresAt,
      }
    },

    verifyToken(token: string): boolean {
      const [version, expiresAtSeconds, signature] = token.split('.')
      if (version !== TOKEN_VERSION || !expiresAtSeconds || !signature) {
        return false
      }

      const expiresAt = Number(expiresAtSeconds)
      if (!Number.isFinite(expiresAt) || expiresAt * 1000 <= now()) return false

      return matchesSecret(signToken(expiresAt, signingKey), signature)
    },
  }
}

export type AccessVerifier = ReturnType<typeof createAccessVerifier>

/** Verifiers are cached per secret so the replay guard and the derived signing
 * key survive between requests on a warm instance. */
const sharedVerifiers = new Map<string, AccessVerifier>()

export function sharedAccessVerifier(secret: string): AccessVerifier {
  const cached = sharedVerifiers.get(secret)
  if (cached) return cached

  const verifier = createAccessVerifier({ secret })
  sharedVerifiers.set(secret, verifier)
  return verifier
}

/** The token a request carries: the header (Studio, curl, tests) or the cookie
 * the website's exchange set. */
export function readAccessToken(c: Context<HonoEnv>): string | null {
  return (
    c.req.header(ACCESS_TOKEN_HEADER) ??
    getCookie(c, ADMIN_ACCESS_COOKIE) ??
    null
  )
}

/** Stores the token where a server-rendered page can reach it. Shared across
 * the parent domain so both the site and the API see it; the API still verifies
 * the signature on every call, so the cookie is not trusted by itself. */
export function setAccessCookie(c: Context<HonoEnv>, token: string): void {
  const secure =
    c.env.NODE_ENV === 'production' || c.req.url.startsWith('https://')

  setCookie(c, ADMIN_ACCESS_COOKIE, token, {
    path: '/',
    domain: process.env.COOKIE_DOMAIN || undefined,
    httpOnly: true,
    secure,
    sameSite: 'Lax',
    maxAge: Math.floor(ACCESS_TOKEN_TTL_MS / 1000),
  })
}

/**
 * The failure response for a request whose unlock token is missing, spent or
 * unverifiable, or `null` when the token is good. Shared by the website's guard
 * and by `GET /api/admin/access`, which only reports the state.
 */
export function accessTokenFailure(c: Context<HonoEnv>): Response | null {
  const secret = c.env.ADMIN_TOTP_SECRET
  const token = readAccessToken(c)

  if (!secret || !token) {
    return c.json({ error: 'Admin access code required' }, 401)
  }

  try {
    if (!sharedAccessVerifier(secret).verifyToken(token)) {
      return c.json({ error: 'Admin access expired. Enter a new code.' }, 401)
    }
  } catch (error) {
    if (!(error instanceof InvalidSecretError)) throw error
    honoLog({
      logLevel: 'error',
      message: `ADMIN_TOTP_SECRET is unusable: ${error.message}`,
    })
    return c.json({ error: 'Admin access is not configured' }, 503)
  }

  return null
}

/**
 * Guards a website admin route: the caller has to be the site itself (another
 * site cannot ride an operator's cookie) and to hold a live unlock. A missing
 * `Origin` is allowed because server-rendered admin pages call the API from
 * Node; the token and the route's own session check still apply.
 */
export const requireAdminAccess: MiddlewareHandler<HonoEnv> = async (
  c,
  next
) => {
  if (!isAllowedOrigin(c, c.env.WEBSITE_ORIGIN, { allowMissing: true })) {
    honoLog({
      logLevel: 'warn',
      message: `Rejected ${c.req.method} ${c.req.path} from origin ${c.req.header('origin') ?? '(none)'}.`,
    })
    return c.json({ error: 'Forbidden' }, 403)
  }

  const failure = accessTokenFailure(c)
  if (failure) return failure

  return next()
}
