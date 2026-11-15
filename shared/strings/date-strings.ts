/**
 * Month and weekday names, spelled out per language rather than read from
 * `Intl.DateTimeFormat`.
 *
 * A runtime without a language's data does not fail — it silently falls back to
 * another one. `mk-MK` resolves to `en-US` in a browser built without
 * Macedonian data, which rendered `Sunday, November 15` inside a Macedonian
 * page and, worse, disagreed with the server (Node ships the full data and
 * rendered `недела, 15 ноември`), so hydration replaced the right text with the
 * wrong one. These tables keep the server and the browser on the same string in
 * every runtime.
 *
 * Indexes are `Date#getMonth()` (0 = January) and `Date#getDay()` (0 = Sunday).
 * Short forms carry their own punctuation, so a caller only joins them.
 */
export const DATE_STRINGS_PACK = {
  months: {
    en: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
    mk: [
      'јануари',
      'февруари',
      'март',
      'април',
      'мај',
      'јуни',
      'јули',
      'август',
      'септември',
      'октомври',
      'ноември',
      'декември',
    ],
  },
  monthsShort: {
    en: [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ],
    mk: [
      'јан.',
      'фев.',
      'мар.',
      'апр.',
      'мај',
      'јун.',
      'јул.',
      'авг.',
      'септ.',
      'окт.',
      'ноем.',
      'дек.',
    ],
  },
  weekdays: {
    en: [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ],
    mk: [
      'недела',
      'понеделник',
      'вторник',
      'среда',
      'четврток',
      'петок',
      'сабота',
    ],
  },
  weekdaysShort: {
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    mk: ['нед.', 'пон.', 'вто.', 'сре.', 'чет.', 'пет.', 'саб.'],
  },
} as const
