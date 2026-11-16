import type {
  CalendarEventType,
  CalendarImportance,
  CalendarView,
} from '@shared/config/calendar'
import type { CalendarEventsQueryResult } from '@shared/types/sanity.types'
import type { WithResolvedSanityData } from '@shared/types/sanity-transform.types'

/**
 * One event as the calendar query returns it — every event of every attached
 * calendar, already narrowed to the year around the build. `description` is
 * optional in the schema, so this passes `never` for the rich-text key: the
 * default would force it non-null and the component would render an empty
 * paragraph for every event without one.
 */
export type CalendarEventRecord = WithResolvedSanityData<
  CalendarEventsQueryResult[number],
  'picture' | 'logo',
  never
>

/** A link target for a related academic page, or plain text when the document
 * has no database record and therefore no page. */
export type CalendarEntityLink = {
  id: string
  name: string
  href: string | null
}

export type CalendarEventViewModel = {
  id: string
  title: string
  /** ISO instant, bucketed into a day by `calendarDayKey`. */
  date: string
  type: CalendarEventType
  importance: CalendarImportance
  description: string | null
  subject: CalendarEntityLink | null
  professors: Array<CalendarEntityLink>
}

export type CalendarDay = {
  /** `YYYY-MM-DD`, in `CALENDAR_TIME_ZONE`. */
  key: string
  /** Full day for the cell's accessible label. */
  label: string
  /** The same day abbreviated — `Fri, 6 Nov 2026` — for a heading that shares
   * its row with other controls. */
  shortLabel: string
  /** The number printed in the cell. */
  dayOfMonth: string
  /** False for the neighbouring-month days a month grid borrows. */
  inPeriod: boolean
  isToday: boolean
  events: Array<CalendarEventViewModel>
  /** Where the cell goes when opened: the week view with this day as its third
   * day. Built by the loader so no component constructs a URL. */
  weekHref: string
}

export type CalendarWeek = {
  key: string
  days: Array<CalendarDay>
}

/** Where the page's own controls point — all `Link`s, so nothing is stateful. */
export type CalendarPeriodLinks = {
  previous: string
  next: string
  today: string
  monthView: string
  weekView: string
}

export type CalendarPageViewModel = {
  view: CalendarView
  /** The study's database id, which a note is keyed on. `null` when the study
   * has no database row yet, so notes cannot be attached to this calendar. */
  studyId: string | null
  /** Whether the period on screen already contains today, which is what
   * disables the "Today" control instead of re-linking to the same page. */
  isAtToday: boolean
  /** `November 2026`, or `3 Nov – 9 Nov` for a week. */
  periodLabel: string
  /** The same period abbreviated — `4 – 10 Nov 2026` — for a heading that
   * shares its row with the arrows. */
  periodLabelShort: string
  timeZone: string
  weekdayLabels: Array<string>
  /** The grid: whole weeks, each of days. */
  weeks: Array<CalendarWeek>
  /** Only the days that have events, in order — the small-screen agenda. */
  agendaDays: Array<CalendarDay>
  eventCount: number
  /** First and last day the calendar holds any event for, or `null` when it is
   * empty. The page can be navigated anywhere; outside this it says so. */
  dataRange: { from: string; to: string } | null
  /** The visible period reaches past `dataRange`. */
  isOutsideData: boolean
  links: CalendarPeriodLinks
}

/** What the layout ships to the client island: no description, no professors. */
export type CalendarAlertEvent = {
  id: string
  title: string
  date: string
  type: CalendarEventType
  importance: CalendarImportance
  subjectDbId: string | null
}

/** A subject of the study whose header is being rendered: the database id
 * matches an event's subject, the name labels the preview. */
export type CalendarAlertSubject = {
  dbId: string
  name: string
}

/** What a study's layout hands the header: the events it can alert on, where
 * its calendar lives, and the subjects it matches them against. */
export type CalendarAlertData = {
  events: Array<CalendarAlertEvent>
  calendarHref: string
  subjects: Array<CalendarAlertSubject>
}
