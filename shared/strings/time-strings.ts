import { DEFAULT_LOCALE } from '../config/localization-constants'
import type { LocalizedText } from '../types/localization.types'
import { getStrings } from '../utils/localized-strings'

/**
 * Relative times as the reader sees them. The `{ en, mk }` entries are the
 * source of truth; `TIME_AGO_STRINGS` below is the English view that call sites
 * which have not adopted `useStrings` still read.
 *
 * Pluralisation stays inside each function: English and Macedonian do not agree
 * on where the boundary is, and one shared `count === 1` rule would be wrong in
 * one of them.
 */
export const TIME_AGO_STRINGS_PACK = {
  justNow: { en: 'Just now', mk: 'Штотуку' },
  oneMinuteAgo: { en: '1 minute ago', mk: 'пред 1 минута' },
  minutesAgo: (count: number): LocalizedText => ({
    en: `${count} minutes ago`,
    mk: `пред ${count} минути`,
  }),
  anHourAgo: { en: 'An hour ago', mk: 'пред еден час' },
  hoursAgo: (count: number): LocalizedText => ({
    en: `${count} hours ago`,
    mk: `пред ${count} часа`,
  }),
  yesterday: { en: 'Yesterday', mk: 'Вчера' },
  daysAgo: (count: number): LocalizedText => ({
    en: `${count} days ago`,
    mk: `пред ${count} дена`,
  }),
  invalidDate: { en: 'Invalid date', mk: 'Невалиден датум' },
} as const

/** English view for call sites that have not adopted `useStrings` yet. */
export const TIME_AGO_STRINGS = getStrings(
  TIME_AGO_STRINGS_PACK,
  DEFAULT_LOCALE
)
