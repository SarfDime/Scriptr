import { DEFAULT_LOCALE, type LocaleId } from '../config/localization-constants'
import { DATE_STRINGS_PACK } from '../strings/date-strings'

/**
 * Every date the reader sees, built from `DATE_STRINGS_PACK` instead of
 * `Intl.DateTimeFormat` — see that pack on why the runtime's locale data is not
 * trusted. A single implementation also means the server and the browser render
 * the same string, whatever their ICU build.
 *
 * The shape follows en-GB for both languages (`15 November 2026`), except the
 * long form with a weekday, where English keeps its `November 15` order.
 */

/** `'local'` reads the clock's own zone (a "now" in the header); `'utc'` reads
 *  the instant's UTC parts, which is what calendar day keys are. */
export type DateFormatTimeZone = 'local' | 'utc'

type DateParts = {
  day: number
  month: number
  year: number
  weekday: number
}

const partsOf = (date: Date, timeZone: DateFormatTimeZone): DateParts =>
  timeZone === 'utc'
    ? {
        day: date.getUTCDate(),
        month: date.getUTCMonth(),
        year: date.getUTCFullYear(),
        weekday: date.getUTCDay(),
      }
    : {
        day: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        weekday: date.getDay(),
      }

const pad = (value: number): string => String(value).padStart(2, '0')

/** English writes the month first in a long date (`November 15`), Macedonian
 *  the day (`15 ноември`). */
const LONG_DATE_ORDER: Record<LocaleId, 'day-month' | 'month-day'> = {
  en: 'month-day',
  mk: 'day-month',
}

/** `Sunday, November 15` / `недела, 15 ноември` — the header's date. */
export const formatWeekdayDayMonth = (
  date: Date,
  locale: LocaleId = DEFAULT_LOCALE,
  timeZone: DateFormatTimeZone = 'local'
): string => {
  const { day, month, weekday } = partsOf(date, timeZone)
  const dayMonth =
    LONG_DATE_ORDER[locale] === 'month-day'
      ? `${DATE_STRINGS_PACK.months[locale][month]} ${day}`
      : `${day} ${DATE_STRINGS_PACK.months[locale][month]}`
  return `${DATE_STRINGS_PACK.weekdays[locale][weekday]}, ${dayMonth}`
}

/** `Sunday, 15 November 2026` / `недела, 15 ноември 2026` */
export const formatWeekdayDayMonthYear = (
  date: Date,
  locale: LocaleId = DEFAULT_LOCALE,
  timeZone: DateFormatTimeZone = 'local'
): string => {
  const { day, month, year, weekday } = partsOf(date, timeZone)
  return `${DATE_STRINGS_PACK.weekdays[locale][weekday]}, ${day} ${DATE_STRINGS_PACK.months[locale][month]} ${year}`
}

/** `Sun` / `нед.` */
export const formatWeekdayShort = (
  date: Date,
  locale: LocaleId = DEFAULT_LOCALE,
  timeZone: DateFormatTimeZone = 'local'
): string => {
  const { weekday } = partsOf(date, timeZone)
  return DATE_STRINGS_PACK.weekdaysShort[locale][weekday] ?? ''
}

/** `15 Nov` / `15 ноем.` */
export const formatDayMonthShort = (
  date: Date,
  locale: LocaleId = DEFAULT_LOCALE,
  timeZone: DateFormatTimeZone = 'local'
): string => {
  const { day, month } = partsOf(date, timeZone)
  return `${day} ${DATE_STRINGS_PACK.monthsShort[locale][month]}`
}

/** `Sun, 15 Nov 2026` / `нед., 15 ноем. 2026` */
export const formatWeekdayShortDayMonthYear = (
  date: Date,
  locale: LocaleId = DEFAULT_LOCALE,
  timeZone: DateFormatTimeZone = 'local'
): string => {
  const { day, month, year, weekday } = partsOf(date, timeZone)
  return `${DATE_STRINGS_PACK.weekdaysShort[locale][weekday]}, ${day} ${DATE_STRINGS_PACK.monthsShort[locale][month]} ${year}`
}

/** `November 2026` / `ноември 2026` */
export const formatMonthYear = (
  date: Date,
  locale: LocaleId = DEFAULT_LOCALE,
  timeZone: DateFormatTimeZone = 'local'
): string => {
  const { month, year } = partsOf(date, timeZone)
  return `${DATE_STRINGS_PACK.months[locale][month]} ${year}`
}

/** `Nov 2026` / `ноем. 2026` */
export const formatMonthShortYear = (
  date: Date,
  locale: LocaleId = DEFAULT_LOCALE,
  timeZone: DateFormatTimeZone = 'local'
): string => {
  const { month, year } = partsOf(date, timeZone)
  return `${DATE_STRINGS_PACK.monthsShort[locale][month]} ${year}`
}

/** `15 Nov 2026` / `15 ноем. 2026` */
export const formatDayMonthShortYear = (
  date: Date,
  locale: LocaleId = DEFAULT_LOCALE,
  timeZone: DateFormatTimeZone = 'local'
): string => {
  const { day, month, year } = partsOf(date, timeZone)
  return `${day} ${DATE_STRINGS_PACK.monthsShort[locale][month]} ${year}`
}

/** `15/11/2026` in English, `15.11.2026` in Macedonian. */
export const formatNumericDate = (
  date: Date,
  locale: LocaleId = DEFAULT_LOCALE,
  timeZone: DateFormatTimeZone = 'local'
): string => {
  const { day, month, year } = partsOf(date, timeZone)
  const separator = locale === 'mk' ? '.' : '/'
  return [pad(day), pad(month + 1), year].join(separator)
}
