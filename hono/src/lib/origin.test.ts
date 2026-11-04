import assert from 'node:assert/strict'
import test from 'node:test'
import type { Context } from 'hono'
import type { Env, HonoEnv } from '../types/env.types'
import { isAllowedOrigin } from './origin'

const context = (
  origin: string | undefined,
  env: Partial<Env> = {}
): Context<HonoEnv> =>
  ({
    env,
    req: { header: (name: string) => (name === 'origin' ? origin : undefined) },
  }) as unknown as Context<HonoEnv>

const SITE = 'https://scriptr.uk'

test('accepts the configured origin, ignoring case and a trailing slash', () => {
  assert.equal(isAllowedOrigin(context(SITE), SITE), true)
  assert.equal(isAllowedOrigin(context(SITE), `${SITE}/`), true)
  assert.equal(isAllowedOrigin(context('HTTPS://SCRIPTR.UK'), SITE), true)
})

test('rejects a different origin even when one is configured', () => {
  assert.equal(isAllowedOrigin(context('https://evil.test'), SITE), false)
})

test('rejects everything when no origin is configured', () => {
  assert.equal(isAllowedOrigin(context(SITE), undefined), false)
  assert.equal(isAllowedOrigin(context(SITE), ''), false)
})

test('a missing origin follows NODE_ENV unless allowMissing is set', () => {
  const production = context(undefined, { NODE_ENV: 'production' })
  const development = context(undefined, { NODE_ENV: 'development' })

  assert.equal(isAllowedOrigin(production, SITE), false)
  assert.equal(isAllowedOrigin(development, SITE), true)
  assert.equal(isAllowedOrigin(production, SITE, { allowMissing: true }), true)
  assert.equal(
    isAllowedOrigin(development, SITE, { allowMissing: false }),
    true,
    'development never requires an origin'
  )
})

test('allowMissing does not make a foreign origin acceptable', () => {
  const production = context('https://evil.test', { NODE_ENV: 'production' })
  assert.equal(isAllowedOrigin(production, SITE, { allowMissing: true }), false)
})
