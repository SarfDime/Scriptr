import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolveCorsOrigin } from './cors'

test('allows the local development origins outside production', () => {
  for (const origin of [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:3333',
  ]) {
    assert.equal(
      resolveCorsOrigin(origin, {
        configuredOrigins: '',
        nodeEnv: 'development',
      }),
      origin
    )
  }
})

test('withholds the local development origins in production', () => {
  for (const origin of [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:3333',
  ]) {
    assert.equal(
      resolveCorsOrigin(origin, {
        configuredOrigins: '',
        nodeEnv: 'production',
      }),
      ''
    )
  }
})

test('honours a configured origin in production', () => {
  assert.equal(
    resolveCorsOrigin('https://scriptr.sanity.studio', {
      configuredOrigins:
        'https://scriptr.uk,*.scriptr.uk,https://scriptr.sanity.studio',
      nodeEnv: 'production',
    }),
    'https://scriptr.sanity.studio'
  )
})

test('rejects an origin that is not configured', () => {
  assert.equal(
    resolveCorsOrigin('https://evil.example.com', {
      configuredOrigins: 'https://scriptr.uk',
      nodeEnv: 'production',
    }),
    ''
  )
})

test('matches wildcard subdomain entries over https only', () => {
  assert.equal(
    resolveCorsOrigin('https://api.scriptr.uk', {
      configuredOrigins: '*.scriptr.uk',
      nodeEnv: 'production',
    }),
    'https://api.scriptr.uk'
  )
  assert.equal(
    resolveCorsOrigin('https://scriptr.uk', {
      configuredOrigins: '*.scriptr.uk',
      nodeEnv: 'production',
    }),
    ''
  )
  assert.equal(
    resolveCorsOrigin('https://scriptr.uk.evil.com', {
      configuredOrigins: '*.scriptr.uk',
      nodeEnv: 'production',
    }),
    ''
  )
  assert.equal(
    resolveCorsOrigin('http://api.scriptr.uk', {
      configuredOrigins: '*.scriptr.uk',
      nodeEnv: 'production',
    }),
    ''
  )
})

test('ignores blank entries instead of matching an empty origin', () => {
  assert.equal(
    resolveCorsOrigin('', { configuredOrigins: ' , ', nodeEnv: 'production' }),
    ''
  )
})
