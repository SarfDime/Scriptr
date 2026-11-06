/**
 * The academic calendar's shared rules. Everything that has to agree between
 * the Sanity schema, the server-rendered page and the client alert island
 * lives here: the type and importance lists (the schema builds its pickers
 * from them and the UI builds its labels from them), the week start, the zone
 * and the per-type colour schemes.
 *
 * Labels are in `shared/strings/calendar-strings.ts`; this file holds no copy.
 */

/**
 * The zone every calendar day is bucketed in. The academic calendar is
 * published in local time, so an event at 00:30 belongs to that local day even
 * when the server building the page runs in UTC — the server's own zone is
 * never used to derive a day key.
 */
export const CALENDAR_TIME_ZONE = 'Europe/Skopje'

/** ISO weekday the calendar grid starts on: 1 = Monday. */
export const WEEK_STARTS_ON = 1

/** Where the focused day sits in a week view: the third of the seven days, so
 * two days of that week stay visible before it. Used when a month cell opens
 * its week. */
export const WEEK_VIEW_ANCHOR_OFFSET = 2

/** How far ahead the header alert looks, in days from today (inclusive). */
export const CALENDAR_ALERT_WINDOW_DAYS = 7

/** A calendar document covers six months, and the site reads the six months
 * before today as well as the six after — a year of events at build time. */
export const CALENDAR_EVENT_MARGIN_MONTHS = 6

/** The first half-year a calendar can cover; the picker never goes earlier. */
export const CALENDAR_PERIOD_START_YEAR = 2026

/** How many years past the current one the period picker offers. */
export const CALENDAR_PERIOD_YEARS_AHEAD = 5

export type CalendarPeriod = {
  /** Stable id stored on the document: `2026-h1`, `2026-h2`, … */
  id: string
  year: number
  /** 1 = January–June, 2 = July–December. */
  half: 1 | 2
  /** First day of the half, `YYYY-MM-DD`. */
  from: string
  /** Last day of the half, `YYYY-MM-DD`. */
  to: string
}

/** One half-year, always starting on 1 January or 1 July. */
export const calendarPeriod = (year: number, half: 1 | 2): CalendarPeriod => ({
  id: `${year}-h${half}`,
  year,
  half,
  from: `${year}-${half === 1 ? '01-01' : '07-01'}`,
  to: `${year}-${half === 1 ? '06-30' : '12-31'}`,
})

/** Every half-year a calendar may be created for. */
export const calendarPeriods = (
  now: Date = new Date()
): Array<CalendarPeriod> => {
  const lastYear = Math.max(
    now.getUTCFullYear() + CALENDAR_PERIOD_YEARS_AHEAD,
    CALENDAR_PERIOD_START_YEAR
  )
  const periods: Array<CalendarPeriod> = []

  for (let year = CALENDAR_PERIOD_START_YEAR; year <= lastYear; year += 1) {
    periods.push(calendarPeriod(year, 1), calendarPeriod(year, 2))
  }

  return periods
}

export const findCalendarPeriod = (
  id: string | null | undefined
): CalendarPeriod | undefined =>
  id ? calendarPeriods().find((period) => period.id === id) : undefined

/** The half-year a `YYYY-MM-DD` day belongs to. */
export const calendarPeriodForDayKey = (dayKey: string): CalendarPeriod => {
  const half: 1 | 2 = Number(dayKey.slice(5, 7)) <= 6 ? 1 : 2
  return calendarPeriod(Number(dayKey.slice(0, 4)), half)
}

export const CALENDAR_EVENT_TYPES = [
  'exam',
  'preliminary_exam',
  'reminder',
  'info',
  'announcement',
] as const

export type CalendarEventType = (typeof CALENDAR_EVENT_TYPES)[number]

export const CALENDAR_IMPORTANCES = ['low', 'normal', 'high'] as const

export type CalendarImportance = (typeof CALENDAR_IMPORTANCES)[number]

export const DEFAULT_CALENDAR_IMPORTANCE: CalendarImportance = 'normal'

/** Types that are meaningless without the subject they examine. */
export const CALENDAR_SUBJECT_REQUIRED_TYPES = [
  'exam',
  'preliminary_exam',
] as const

/** Whether the Studio (and the type) requires a `subject` for this type. */
export const isCalendarSubjectRequired = (type: string | undefined) =>
  CALENDAR_SUBJECT_REQUIRED_TYPES.some((required) => required === type)

export const CALENDAR_VIEWS = ['month', 'week'] as const

export type CalendarView = (typeof CALENDAR_VIEWS)[number]

export const DEFAULT_CALENDAR_VIEW: CalendarView = 'month'

/** The `?view=` query parameter name for the calendar page. */
export const CALENDAR_VIEW_PARAM = 'view'

/** The `?date=` query parameter name for the calendar page. */
export const CALENDAR_DATE_PARAM = 'date'

type CalendarPaletteName = 'red' | 'amber' | 'sky' | 'gray' | 'brand'

export type CalendarTypeScheme = {
  /** Chip surface + border, for a chip that is not a link: `cp-<name>`. */
  chip: `cp-${CalendarPaletteName}`
  /** The same palette as an interactive chip: `cp-<name>-int`. */
  chipLink: `cp-${CalendarPaletteName}-int`
}

/**
 * One distinct `cp-*` palette per type, so a reader can tell an exam from an
 * announcement before reading the label. Importance never appears here: it
 * only adds emphasis (a ring or a dot), never a different hue.
 */
export const CALENDAR_TYPE_SCHEMES: Record<
  CalendarEventType,
  CalendarTypeScheme
> = {
  exam: { chip: 'cp-red', chipLink: 'cp-red-int' },
  preliminary_exam: { chip: 'cp-amber', chipLink: 'cp-amber-int' },
  reminder: { chip: 'cp-sky', chipLink: 'cp-sky-int' },
  info: { chip: 'cp-gray', chipLink: 'cp-gray-int' },
  announcement: { chip: 'cp-brand', chipLink: 'cp-brand-int' },
}

// ---------------------------------------------------------------------------
// Personal notes
// ---------------------------------------------------------------------------

/** The sync allowance, shown in Preferences and enforced by the API. Both
 * windows count a push and a pull alike. */
export const CALENDAR_NOTES_SYNC_SHORT_LIMIT = 3
export const CALENDAR_NOTES_SYNC_SHORT_MINUTES = 30
export const CALENDAR_NOTES_SYNC_DAILY_LIMIT = 12

/** A note is personal and private; its types are a separate list from the
 * event types so the two never share a palette. */
export const CALENDAR_NOTE_TYPES = [
  'note',
  'exam',
  'preliminary_exam',
  'exam_result',
] as const

export type CalendarNoteType = (typeof CALENDAR_NOTE_TYPES)[number]

export const DEFAULT_CALENDAR_NOTE_TYPE: CalendarNoteType = 'note'

/** Notes allowed on one day of the month. */
export const CALENDAR_NOTES_PER_DAY = 3

export const CALENDAR_NOTE_TITLE_MAX = 80
export const CALENDAR_NOTE_BODY_MAX = 2000

/** How many notes one profile may hold after a sync. */
export const CALENDAR_NOTES_MAX_PER_PROFILE = 500

/** The palettes the event types leave free, so a note can never be mistaken for
 * an event. */
type CalendarNotePaletteName = 'rose' | 'blue' | 'green' | 'yellow'

export const CALENDAR_NOTE_SCHEMES: Record<
  CalendarNoteType,
  { chip: `cp-${CalendarNotePaletteName}` }
> = {
  note: { chip: 'cp-yellow' },
  exam: { chip: 'cp-rose' },
  preliminary_exam: { chip: 'cp-blue' },
  exam_result: { chip: 'cp-green' },
}
