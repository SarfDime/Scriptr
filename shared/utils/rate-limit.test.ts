import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createRateLimiter } from './rate-limit'

const createClock = (start = 1_000_000) => {
  let time = start
  return {
    now: () => time,
    advance: (ms: number) => {
      time += ms
    },
  }
}

test('allows requests up to the limit, then blocks', () => {
  const { now } = createClock()
  const isLimited = createRateLimiter({ limit: 2, windowMs: 1000, now })

  assert.equal(isLimited('a'), false)
  assert.equal(isLimited('a'), false)
  assert.equal(isLimited('a'), true)
})

test('tracks keys independently', () => {
  const { now } = createClock()
  const isLimited = createRateLimiter({ limit: 1, windowMs: 1000, now })

  assert.equal(isLimited('a'), false)
  assert.equal(isLimited('a'), true)
  assert.equal(isLimited('b'), false)
})

test('frees up once requests age out of the window', () => {
  const clock = createClock()
  const isLimited = createRateLimiter({
    limit: 2,
    windowMs: 1000,
    now: clock.now,
  })

  isLimited('a')
  isLimited('a')
  assert.equal(isLimited('a'), true)

  clock.advance(1000)
  assert.equal(isLimited('a'), false)
})

test('does not count blocked requests by default', () => {
  const clock = createClock()
  const isLimited = createRateLimiter({
    limit: 1,
    windowMs: 1000,
    now: clock.now,
  })

  assert.equal(isLimited('a'), false)
  clock.advance(600)
  assert.equal(isLimited('a'), true)
  // Only the first request counted, so the window ends 1000ms after it.
  clock.advance(400)
  assert.equal(isLimited('a'), false)
})

test('countBlocked keeps a client blocked until it has been quiet for a window', () => {
  const clock = createClock()
  const isLimited = createRateLimiter({
    limit: 1,
    windowMs: 1000,
    countBlocked: true,
    now: clock.now,
  })

  assert.equal(isLimited('a'), false)
  clock.advance(600)
  assert.equal(isLimited('a'), true)
  clock.advance(400)
  assert.equal(isLimited('a'), true)

  clock.advance(999)
  assert.equal(isLimited('a'), true)
})

test('countBlocked lets a client back in after a full quiet window', () => {
  const clock = createClock()
  const isLimited = createRateLimiter({
    limit: 1,
    windowMs: 1000,
    countBlocked: true,
    now: clock.now,
  })

  isLimited('a')
  clock.advance(600)
  isLimited('a')

  clock.advance(1000)
  assert.equal(isLimited('a'), false)
})
