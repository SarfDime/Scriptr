import {
  CALENDAR_ALERT_WINDOW_DAYS,
  CALENDAR_EVENT_MARGIN_MONTHS,
  CALENDAR_TIME_ZONE,
  CALENDAR_VIEWS,
  type CalendarEventType,
  type CalendarImportance,
  type CalendarView,
  DEFAULT_CALENDAR_VIEW,
  WEEK_STARTS_ON,
  WEEK_VIEW_ANCHOR_OFFSET,
} from '@shared/config/calendar'

/**
 * Pure calendar arithmetic and matching — no fetching and no request APIs, so
 * the server loader and the client alert island share exactly one
 * implementation.
 *
 * Days are handled as `YYYY-MM-DD` keys plus "UTC midnight" epoch numbers:
 * date-only arithmetic cannot drop or duplicate a day across a DST change, and
 * a key derived from an instant always goes through `CALENDAR_TIME_ZONE` rather
 * than the server's own zone.
 */

export const MS_PER_DAY = 86_400_000

const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: CALENDAR_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const dayLabelFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

const dayShortFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

const dateShortFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

const monthLabelFormatter = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

const monthShortLabelFormatter = new Intl.DateTimeFormat('en-GB', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

const dayOfMonthFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  timeZone: 'UTC',
})

const weekdayShortFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  timeZone: 'UTC',
})

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: CALENDAR_TIME_ZONE,
})

/** `YYYY-MM-DD` for an instant, in `CALENDAR_TIME_ZONE`. */
export const calendarDayKey = (value: string | number | Date): string => {
  const date = value instanceof Date ? value : new Date(value)
  const parts = dayKeyFormatter.formatToParts(date)
  const read = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? ''

  return `${read('year')}-${read('month')}-${read('day')}`
}

/**
 * Today's day key in `CALENDAR_TIME_ZONE`. Named so the client island reads the
 * clock through one documented call: what it renders is "what is coming up
 * now", and it only does so after mounting.
 */
export const currentCalendarDayKey = (): string => calendarDayKey(Date.now())

/** UTC midnight of a day key, as epoch milliseconds. */
export const dayKeyToUtc = (dayKey: string): number => {
  const [year = 1970, month = 1, day = 1] = dayKey.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

export const utcToDayKey = (utc: number): string =>
  new Date(utc).toISOString().slice(0, 10)

export const shiftDayKey = (dayKey: string, days: number): string =>
  utcToDayKey(dayKeyToUtc(dayKey) + days * MS_PER_DAY)

/** A real calendar day, not merely a well-formed string. */
export const isValidDayKey = (value: string | undefined): value is string =>
  Boolean(
    value &&
      DAY_KEY_PATTERN.test(value) &&
      utcToDayKey(dayKeyToUtc(value)) === value
  )

export const parseCalendarView = (value: string | undefined): CalendarView =>
  CALENDAR_VIEWS.find((view) => view === value) ?? DEFAULT_CALENDAR_VIEW

/** `toKey - fromKey` in days. */
export const dayKeyDistance = (fromKey: string, toKey: string): number =>
  Math.round((dayKeyToUtc(toKey) - dayKeyToUtc(fromKey)) / MS_PER_DAY)

/**
 * The year the site reads around the build: six months before today and six
 * after. Everything the calendar query returns is already inside it.
 */
export const calendarMarginWindow = (now: Date = new Date()) => {
  const monthsFromNow = (months: number) =>
    new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() + months,
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds()
      )
    ).toISOString()

  return {
    from: monthsFromNow(-CALENDAR_EVENT_MARGIN_MONTHS),
    to: monthsFromNow(CALENDAR_EVENT_MARGIN_MONTHS),
  }
}

/** First day of the grid week `dayKey` falls in, using `WEEK_STARTS_ON`. */
const startOfCalendarWeek = (dayKey: string): string => {
  const weekday = new Date(dayKeyToUtc(dayKey)).getUTCDay()
  const offset = (weekday - WEEK_STARTS_ON + 7) % 7
  return shiftDayKey(dayKey, -offset)
}

/** Last day of the month `dayKey` falls in. */
export const endOfCalendarMonth = (dayKey: string): string =>
  utcToDayKey(
    Date.UTC(Number(dayKey.slice(0, 4)), Number(dayKey.slice(5, 7)), 0)
  )

/** `dayKey` moved by whole months, clamped to the target month's length. */
export const addCalendarMonths = (dayKey: string, months: number): string => {
  const [year = 1970, month = 1, day = 1] = dayKey.split('-').map(Number)
  const target = new Date(Date.UTC(year, month - 1 + months, 1))
  const targetYear = target.getUTCFullYear()
  const targetMonth = target.getUTCMonth()
  const daysInTarget = new Date(
    Date.UTC(targetYear, targetMonth + 1, 0)
  ).getUTCDate()

  return utcToDayKey(
    Date.UTC(targetYear, targetMonth, Math.min(day, daysInTarget))
  )
}

export type CalendarGrid = {
  /** Every day on the grid, in order. */
  days: Array<string>
  /** `days` split into rows of seven. */
  weeks: Array<Array<string>>
  /** First and last day on the grid — the window the query has to cover. */
  startKey: string
  endKey: string
}

/**
 * Grid days for a view. Month view fills whole weeks around the month, so the
 * grid can start in the previous month and end in the next one.
 *
 * Week view puts `anchorKey` on the third of its seven days rather than starting
 * the week on `WEEK_STARTS_ON`: that is what a month cell opens, and it keeps
 * the day of interest away from either edge of the row.
 */
export const buildCalendarGrid = (
  view: CalendarView,
  anchorKey: string
): CalendarGrid => {
  if (view === 'week') {
    const startKey = shiftDayKey(anchorKey, -WEEK_VIEW_ANCHOR_OFFSET)
    const days = Array.from({ length: 7 }, (_, index) =>
      shiftDayKey(startKey, index)
    )

    return {
      days,
      weeks: [days],
      startKey,
      endKey: days[6] ?? startKey,
    }
  }

  const firstDay = `${anchorKey.slice(0, 7)}-01`
  const lastDay = endOfCalendarMonth(anchorKey)

  const startKey = startOfCalendarWeek(firstDay)
  const endKey = shiftDayKey(startOfCalendarWeek(lastDay), 6)
  const dayCount = dayKeyDistance(startKey, endKey) + 1
  const days = Array.from({ length: dayCount }, (_, index) =>
    shiftDayKey(startKey, index)
  )
  const weeks = Array.from({ length: dayCount / 7 }, (_, index) =>
    days.slice(index * 7, index * 7 + 7)
  )

  return { days, weeks, startKey, endKey }
}

export const formatCalendarDay = (dayKey: string): string =>
  dayLabelFormatter.format(new Date(dayKeyToUtc(dayKey)))

export const formatCalendarDayShort = (dayKey: string): string =>
  dayShortFormatter.format(new Date(dayKeyToUtc(dayKey)))

export const formatCalendarDateShort = (dayKey: string): string =>
  dateShortFormatter.format(new Date(dayKeyToUtc(dayKey)))

export const formatCalendarWeekday = (dayKey: string): string =>
  weekdayShortFormatter.format(new Date(dayKeyToUtc(dayKey)))

export const formatCalendarMonth = (dayKey: string): string =>
  monthLabelFormatter.format(new Date(dayKeyToUtc(dayKey)))

export const formatCalendarMonthShort = (dayKey: string): string =>
  monthShortLabelFormatter.format(new Date(dayKeyToUtc(dayKey)))

/**
 * Heading for the visible range. The month comes from the anchor, not from the
 * grid: a month grid borrows days from the neighbouring months, and the heading
 * has to name the month being looked at.
 */
export const formatCalendarPeriod = (
  view: CalendarView,
  grid: CalendarGrid,
  anchorKey: string,
  compact = false
): string => {
  if (view === 'month') return formatCalendarMonth(anchorKey)
  if (grid.startKey.slice(0, 7) === grid.endKey.slice(0, 7)) {
    // `4 – 10 November 2026`, or `4 – 10 Nov 2026` where the heading shares its
    // row with the arrows.
    const month = compact
      ? formatCalendarMonthShort(grid.startKey)
      : formatCalendarMonth(grid.startKey)
    return `${dayOfMonthFormatter.format(new Date(dayKeyToUtc(grid.startKey)))} – ${dayOfMonthFormatter.format(new Date(dayKeyToUtc(grid.endKey)))} ${month}`
  }
  return `${formatCalendarDayShort(grid.startKey)} – ${formatCalendarDayShort(grid.endKey)}`
}

export const formatCalendarTime = (date: string): string =>
  timeFormatter.format(new Date(date))

export type CalendarAlertCandidate = {
  id: string
  date: string
  type: CalendarEventType
  importance: CalendarImportance
  subjectDbId: string | null
}

/**
 * Whether an event belongs in the header alert. `uncompletedSubjectDbIds` is
 * `null` while the session (and so the account's subjects) is unknown, which
 * narrows the alert to the global branch: a high-importance event with no
 * subject. A high-importance event for a subject the reader has completed is
 * deliberately not a match.
 */
export const matchesCalendarAlert = (
  event: CalendarAlertCandidate,
  todayKey: string,
  uncompletedSubjectDbIds: ReadonlySet<string> | null
): boolean => {
  const distance = dayKeyDistance(todayKey, calendarDayKey(event.date))
  if (distance < 0 || distance > CALENDAR_ALERT_WINDOW_DAYS) return false

  if (!event.subjectDbId) return event.importance === 'high'
  return uncompletedSubjectDbIds?.has(event.subjectDbId) ?? false
}
