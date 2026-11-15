import assert from 'node:assert/strict'
import test from 'node:test'
import { TIME_AGO_STRINGS_PACK } from '../strings/time-strings'
import {
  formatDayMonthShort,
  formatDayMonthShortYear,
  formatMonthShortYear,
  formatMonthYear,
  formatNumericDate,
  formatWeekdayDayMonth,
  formatWeekdayDayMonthYear,
  formatWeekdayShortDayMonthYear,
} from './date-format.utils'
import { getStrings } from './localized-strings'

/** Sunday, 15 November 2026, midday UTC — read in UTC so the assertions hold in
 *  every machine's time zone. */
const SUNDAY = new Date(Date.UTC(2026, 10, 15, 12))

test('the header date reads in the page language, not the runtime one', () => {
  assert.equal(formatWeekdayDayMonth(SUNDAY, 'mk', 'utc'), 'недела, 15 ноември')
  assert.equal(
    formatWeekdayDayMonth(SUNDAY, 'en', 'utc'),
    'Sunday, November 15'
  )
})

test('each calendar and profile formatter spells its names out', () => {
  assert.equal(
    formatWeekdayDayMonthYear(SUNDAY, 'mk', 'utc'),
    'недела, 15 ноември 2026'
  )
  assert.equal(
    formatWeekdayDayMonthYear(SUNDAY, 'en', 'utc'),
    'Sunday, 15 November 2026'
  )
  assert.equal(formatDayMonthShort(SUNDAY, 'mk', 'utc'), '15 ноем.')
  assert.equal(formatDayMonthShort(SUNDAY, 'en', 'utc'), '15 Nov')
  assert.equal(
    formatWeekdayShortDayMonthYear(SUNDAY, 'mk', 'utc'),
    'нед., 15 ноем. 2026'
  )
  assert.equal(
    formatWeekdayShortDayMonthYear(SUNDAY, 'en', 'utc'),
    'Sun, 15 Nov 2026'
  )
  assert.equal(formatMonthYear(SUNDAY, 'mk', 'utc'), 'ноември 2026')
  assert.equal(formatMonthShortYear(SUNDAY, 'mk', 'utc'), 'ноем. 2026')
  assert.equal(formatDayMonthShortYear(SUNDAY, 'mk', 'utc'), '15 ноем. 2026')
})

test('a numeric date keeps each language’s separator', () => {
  assert.equal(formatNumericDate(SUNDAY, 'mk', 'utc'), '15.11.2026')
  assert.equal(formatNumericDate(SUNDAY, 'en', 'utc'), '15/11/2026')
})

test('relative times keep the Macedonian counted singular after 21, 31, …', () => {
  const mk = getStrings(TIME_AGO_STRINGS_PACK, 'mk')

  assert.equal(mk.minutesAgo(30), 'пред 30 мин.')
  assert.equal(mk.hoursAgo(2), 'пред 2 часа')
  assert.equal(mk.hoursAgo(11), 'пред 11 часа')
  assert.equal(mk.hoursAgo(21), 'пред 21 час')
  assert.equal(mk.daysAgo(2), 'пред 2 дена')
  assert.equal(mk.daysAgo(11), 'пред 11 дена')
  assert.equal(mk.daysAgo(21), 'пред 21 ден')
  assert.equal(mk.yesterday, 'Вчера')
})
