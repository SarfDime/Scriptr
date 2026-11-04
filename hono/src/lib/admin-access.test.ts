import assert from 'node:assert/strict'
import test from 'node:test'
import { Hono } from 'hono'
import {
  ACCESS_TOKEN_HEADER,
  ACCESS_TOKEN_TTL_MS,
} from '../../../shared/config/access'
import type { Env, HonoEnv } from '../types/env.types'
import {
  createAccessVerifier,
  decodeBase32,
  encodeBase32,
  generateTotpSecret,
  requireAdminAccess,
  totpUri,
} from './admin-access'

/** RFC 6238's SHA-1 test secret: the ASCII string "12345678901234567890". */
const RFC_SECRET = encodeBase32(Buffer.from('12345678901234567890'))

/** RFC 6238 vectors, truncated to the six digits this implementation issues. */
const RFC_VECTORS = [
  { seconds: 59, code: '287082' },
  { seconds: 1111111109, code: '081804' },
  { seconds: 1111111111, code: '050471' },
  { seconds: 1234567890, code: '005924' },
  { seconds: 2000000000, code: '279037' },
  { seconds: 20000000000, code: '353130' },
]

const at = (seconds: number) => () => seconds * 1000

test('decodes the RFC 6238 secret to its ASCII bytes', () => {
  assert.equal(
    decodeBase32('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ').toString(),
    '12345678901234567890'
  )
})

test('round-trips base32 encoding, ignoring padding and case', () => {
  const key = Buffer.from('not a real secret')
  assert.equal(
    decodeBase32(`${encodeBase32(key).toLowerCase()}==`).toString(),
    key.toString()
  )
})

test('rejects secrets that are not base32', () => {
  assert.throws(() => decodeBase32('NOT-BASE32!'), {
    name: 'InvalidSecretError',
  })
  assert.throws(() => decodeBase32('   '), { name: 'InvalidSecretError' })
})

test('accepts every RFC 6238 vector', () => {
  for (const { seconds, code } of RFC_VECTORS) {
    const verifier = createAccessVerifier({
      secret: RFC_SECRET,
      now: at(seconds),
    })
    assert.equal(
      verifier.verifyCode(code),
      true,
      `expected ${code} to be valid at ${seconds}`
    )
  }
})

test('rejects wrong codes, wrong lengths and non-digits', () => {
  const verifier = createAccessVerifier({ secret: RFC_SECRET, now: at(59) })
  for (const code of ['287083', '28708', '2870821', 'abcdef', '']) {
    assert.equal(verifier.verifyCode(code), false, code)
  }
})

test('a code cannot be replayed inside its window', () => {
  const verifier = createAccessVerifier({ secret: RFC_SECRET, now: at(59) })
  assert.equal(verifier.verifyCode('287082'), true)
  assert.equal(verifier.verifyCode('287082'), false)
})

test('accepts the previous step for clock drift, and the next one too', () => {
  const previous = createAccessVerifier({ secret: RFC_SECRET, now: at(60) })
  assert.equal(previous.verifyCode('287082'), true)

  const next = createAccessVerifier({ secret: RFC_SECRET, now: at(30) })
  assert.equal(next.verifyCode('050471'), false, 'two steps away is rejected')
})

test('issues a token that verifies until it expires', () => {
  let clock = 1_000_000_000_000
  const verifier = createAccessVerifier({
    secret: RFC_SECRET,
    now: () => clock,
  })

  const { token, expiresAt } = verifier.issueToken()
  assert.equal(expiresAt, clock + ACCESS_TOKEN_TTL_MS)
  assert.equal(verifier.verifyToken(token), true)

  clock += ACCESS_TOKEN_TTL_MS - 1000
  assert.equal(verifier.verifyToken(token), true)

  clock += 1000
  assert.equal(verifier.verifyToken(token), false)
})

test('rejects tampered, malformed and foreign tokens', () => {
  const verifier = createAccessVerifier({ secret: RFC_SECRET, now: at(59) })
  const { token } = verifier.issueToken()
  const [version, expiresAt, signature] = token.split('.')

  assert.equal(
    verifier.verifyToken(`${version}.${Number(expiresAt) + 600}.${signature}`),
    false
  )
  assert.equal(
    verifier.verifyToken(`${version}.${expiresAt}.${signature}x`),
    false
  )
  assert.equal(verifier.verifyToken(`${version}.${expiresAt}`), false)
  assert.equal(verifier.verifyToken(''), false)
  assert.equal(verifier.verifyToken('v2.1.2'), false)

  const other = createAccessVerifier({
    secret: generateTotpSecret(),
    now: at(59),
  })
  assert.equal(other.verifyToken(token), false)
})

test('a generated secret is base32 and at least 128 bits', () => {
  const secret = generateTotpSecret()
  assert.match(secret, /^[A-Z2-7]+$/)
  assert.ok(decodeBase32(secret).length >= 16)
})

test('builds an enrolable otpauth URI', () => {
  const uri = new URL(
    totpUri({ secret: 'GEZDGNBV', account: 'me@example.com' })
  )
  assert.equal(uri.protocol, 'otpauth:')
  assert.equal(uri.searchParams.get('secret'), 'GEZDGNBV')
  assert.equal(uri.searchParams.get('issuer'), 'Scriptr')
  assert.equal(uri.searchParams.get('digits'), '6')
  assert.equal(uri.searchParams.get('period'), '30')
})

const guardApp = (env: Partial<Env>, token?: string) => {
  const app = new Hono<HonoEnv>()
  app.use('*', async (c, next) => {
    c.env = env as Env
    await next()
  })
  app.get('/', requireAdminAccess, (c) => c.json({ ok: true }))
  return (origin?: string) =>
    app.request('/', {
      headers: {
        ...(origin ? { origin } : {}),
        ...(token ? { [ACCESS_TOKEN_HEADER]: token } : {}),
      },
    })
}

const guardEnv = (secret: string, nodeEnv = 'development'): Partial<Env> => ({
  ADMIN_TOTP_SECRET: secret,
  WEBSITE_ORIGIN: 'https://site.test',
  NODE_ENV: nodeEnv as Env['NODE_ENV'],
})

test('the admin guard rejects a missing or forged token', async () => {
  const secret = generateTotpSecret()
  const token = createAccessVerifier({ secret }).issueToken().token

  assert.equal(
    (await guardApp(guardEnv(secret))('https://site.test')).status,
    401
  )
  assert.equal(
    (
      await guardApp(
        guardEnv(secret),
        'v1.9999999999.deadbeef'
      )('https://site.test')
    ).status,
    401
  )
  assert.equal(
    (await guardApp(guardEnv(secret), token)('https://site.test')).status,
    200
  )
})

test('the admin guard rejects a foreign origin even with a valid token', async () => {
  const secret = generateTotpSecret()
  const token = createAccessVerifier({ secret }).issueToken().token
  const call = guardApp(guardEnv(secret), token)

  assert.equal((await call('https://evil.test')).status, 403)
  assert.equal((await call('https://studio.test')).status, 403)
})

test('the admin guard allows a missing origin, for server-rendered pages', async () => {
  const secret = generateTotpSecret()
  const token = createAccessVerifier({ secret }).issueToken().token

  assert.equal(
    (await guardApp(guardEnv(secret, 'production'), token)()).status,
    200
  )
})

test('the admin guard fails closed when the secret is missing', async () => {
  const env = { ...guardEnv('GEZDGNBV'), ADMIN_TOTP_SECRET: undefined }
  const response = await guardApp(
    env,
    'v1.9999999999.deadbeef'
  )('https://site.test')

  assert.equal(response.status, 401)
  assert.deepEqual(await response.json(), {
    error: 'Admin access code required',
  })
})

test('an unusable secret is reported as unconfigured', async () => {
  const response = await guardApp(
    guardEnv('not-a-base32-secret'),
    'v1.9999999999.deadbeef'
  )('https://site.test')

  assert.equal(response.status, 503)
})
