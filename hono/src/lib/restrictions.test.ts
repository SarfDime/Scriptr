import assert from 'node:assert/strict'
import test from 'node:test'
import { computeRestrictionExpiry } from './restrictions'

test('first restriction expires after two weeks', () => {
  assert.equal(
    computeRestrictionExpiry(0, new Date('2026-11-01T10:00:00.000Z')),
    '2026-11-15T10:00:00.000Z'
  )
})

test('second restriction expires one calendar month later', () => {
  assert.equal(
    computeRestrictionExpiry(1, new Date('2024-02-29T10:00:00.000Z')),
    '2024-03-29T10:00:00.000Z'
  )
})

test('calendar-month expiry clamps at the last day of the next month', () => {
  assert.equal(
    computeRestrictionExpiry(1, new Date('2026-01-31T10:00:00.000Z')),
    '2026-02-28T10:00:00.000Z'
  )
})

test('third and later restrictions are permanent', () => {
  assert.equal(
    computeRestrictionExpiry(2, new Date('2026-11-01T10:00:00.000Z')),
    null
  )
  assert.equal(
    computeRestrictionExpiry(12, new Date('2026-11-01T10:00:00.000Z')),
    null
  )
})

test('negative or unsafe prior counts are rejected', () => {
  assert.throws(() => computeRestrictionExpiry(-1, new Date()), RangeError)
  assert.throws(
    () => computeRestrictionExpiry(Number.NaN, new Date()),
    RangeError
  )
})
