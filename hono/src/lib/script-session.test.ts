import assert from 'node:assert/strict'
import { test } from 'node:test'
import { SCRIPT_START_YEAR } from '@shared/config/shared-constants'
import {
  getScriptYears,
  getScriptYearUpperBound,
  isExamSession,
  isValidScriptYear,
} from '@shared/utils/script-session.utils'

/** Midday UTC so the assertions can't trip over a timezone boundary. */
const at = (year: number, month: number, day = 15) =>
  new Date(Date.UTC(year, month - 1, day, 12))

test('recognises only the supported exam sessions', () => {
  assert.equal(isExamSession('january'), true)
  assert.equal(isExamSession('september'), true)
  assert.equal(isExamSession('december'), false)
  assert.equal(isExamSession(null), false)
  assert.equal(isExamSession(6), false)
})

test('a session that has not come around yet stops at the previous year', () => {
  // The reported case: in January 2027 the September session has no 2027 yet.
  assert.equal(getScriptYearUpperBound('september', at(2027, 1)), 2026)
  assert.equal(getScriptYearUpperBound('september', at(2026, 9)), 2026)
  assert.equal(getScriptYearUpperBound('september', at(2026, 8)), 2025)
})

test('a session reached this month already allows the current year', () => {
  assert.equal(getScriptYearUpperBound('january', at(2026, 1, 1)), 2026)
  assert.equal(getScriptYearUpperBound('june', at(2026, 6, 1)), 2026)
  assert.equal(getScriptYearUpperBound('june', at(2026, 5, 31)), 2025)
})

test('the general (all sessions) option has no month, so it can use this year', () => {
  assert.equal(getScriptYearUpperBound(null, at(2026, 1)), 2026)
})

test('years run from the start year down to the bound, newest first', () => {
  assert.deepEqual(getScriptYears(null, at(2026, 10)), [2026, 2025, 2024, 2023])
  assert.deepEqual(
    getScriptYears('september', at(2027, 1)),
    [2026, 2025, 2024, 2023]
  )
  assert.deepEqual(getScriptYears(null, at(SCRIPT_START_YEAR, 6)), [
    SCRIPT_START_YEAR,
  ])
})

test('before the start year there is nothing to choose', () => {
  assert.equal(SCRIPT_START_YEAR, 2023)
  assert.deepEqual(getScriptYears(null, at(2022, 12)), [])
  assert.deepEqual(getScriptYears('september', at(2023, 1)), [])
})

test('validates a year against the session it belongs to', () => {
  const now = at(2027, 1)
  assert.equal(isValidScriptYear('september', 2026, now), true)
  assert.equal(isValidScriptYear('september', 2027, now), false)
  assert.equal(isValidScriptYear(null, 2027, now), true)
  assert.equal(isValidScriptYear(null, 2022, now), false)
  assert.equal(isValidScriptYear(null, 2024.5, now), false)
})
