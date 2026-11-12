import {
  CALENDAR_DATE_PARAM,
  CALENDAR_TIME_ZONE,
  CALENDAR_VIEW_PARAM,
  type CalendarView,
} from '@shared/config/calendar'
import type {
  CalendarDay,
  CalendarEventRecord,
  CalendarEventViewModel,
  CalendarPageViewModel,
  CalendarWeek,
} from '@/types/components/Calendar.types'
import { getAcademicPath, getStudySiteUrl } from './academic-routes'
import {
  addCalendarMonths,
  buildCalendarGrid,
  calendarDayKey,
  endOfCalendarMonth,
  formatCalendarDateShort,
  formatCalendarDay,
  formatCalendarPeriod,
  formatCalendarWeekday,
  isValidDayKey,
  parseCalendarView,
  shiftDayKey,
} from './calendar'
import { loadCalendarEvents } from './calendar-data'
import { catalogUrl } from './study-origin'

/** Next's `searchParams`, already awaited. A repeated parameter arrives as an
 * array and is ignored, which falls back to the default like any other
 * unusable value. */
export type CalendarSearchParams = Record<
  string,
  string | Array<string> | undefined
>

const single = (value: string | Array<string> | undefined) =>
  Array.isArray(value) ? undefined : value

/** A calendar belongs to one study, so every navigation link keeps the site in
 * the address. */
const calendarHref = (siteSlug: string, view: CalendarView, dayKey: string) =>
  `${getStudySiteUrl(siteSlug)}/calendar?${CALENDAR_VIEW_PARAM}=${view}&${CALENDAR_DATE_PARAM}=${dayKey}`

/** A subject page exists only for a document synced to the database (`dbId`),
 * which is the same filter `subjectStaticParamsQuery` applies. */
const subjectLink = (subject: CalendarEventRecord['subject']) => {
  if (!subject?.dbId) return null

  return {
    id: subject._id,
    name: subject.name,
    href: getAcademicPath({
      type: 'subject',
      siteSlug: subject.siteSlug,
      universitySlug: subject.universitySlug,
      facultySlug: subject.facultySlug,
      studySlug: subject.studySlug,
      subjectSlug: subject.slug,
    }),
  }
}

/** Same rule as `professorStaticParamsQuery`: a page exists once the document
 * has a `dbId`, and its slug falls back to `_id` exactly as that query does. */
const professorLink = (
  professor: NonNullable<CalendarEventRecord['professors']>[number]
) => {
  if (!professor.dbId) return null

  return {
    id: professor._id,
    name: professor.name,
    href: catalogUrl(
      getAcademicPath({
        type: 'professor',
        professorSlug: professor.slug,
      })
    ),
  }
}

const toEventViewModel = (
  record: CalendarEventRecord
): CalendarEventViewModel => ({
  id: record._id,
  title: record.title,
  date: record.date,
  type: record.type,
  importance: record.importance,
  description: record.description,
  subject: subjectLink(record.subject),
  professors: (record.professors ?? []).flatMap((professor) => {
    const link = professorLink(professor)
    return link ? [link] : []
  }),
})

/** First and last day the calendar holds an event for, from the day keys the
 * page buckets by — the range the "no data for this period" notice names. */
const calendarDataRange = (records: Array<CalendarEventRecord>) => {
  if (records.length === 0) return null

  const keys = records.map((record) => calendarDayKey(record.date)).sort()

  return { from: keys[0] ?? '', to: keys[keys.length - 1] ?? '' }
}

const groupEventsByDay = (records: Array<CalendarEventRecord>) => {
  const byDay = new Map<string, Array<CalendarEventViewModel>>()

  for (const record of records) {
    const key = calendarDayKey(record.date)
    const dayEvents = byDay.get(key)
    if (dayEvents) {
      dayEvents.push(toEventViewModel(record))
    } else {
      byDay.set(key, [toEventViewModel(record)])
    }
  }

  return byDay
}

/**
 * Loads `/calendar`. The whole calendar is read once (see `loadCalendarEvents`)
 * and filtered in memory for the visible period, so navigating to any date costs
 * no Sanity read. The period may fall outside what the calendar holds; that is
 * reported through `dataRange` / `isOutsideData` rather than by looking empty.
 *
 * A failed read is thrown, not swallowed: the route's error boundary reports
 * "could not load" rather than an empty calendar that reads as "no events".
 */
export const loadCalendarPage = async (
  siteSlug: string,
  params: CalendarSearchParams
): Promise<CalendarPageViewModel> => {
  const view = parseCalendarView(single(params[CALENDAR_VIEW_PARAM]))
  const todayKey = calendarDayKey(Date.now())
  const requestedDay = single(params[CALENDAR_DATE_PARAM])
  const anchorKey = isValidDayKey(requestedDay) ? requestedDay : todayKey
  const grid = buildCalendarGrid(view, anchorKey)
  const records = await loadCalendarEvents(siteSlug)
  const byDay = groupEventsByDay(records)
  const dataRange = calendarDataRange(records)
  const anchorMonth = anchorKey.slice(0, 7)

  const toDay = (key: string): CalendarDay => ({
    key,
    label: formatCalendarDay(key),
    shortLabel: formatCalendarDateShort(key),
    dayOfMonth: String(Number(key.slice(8, 10))),
    inPeriod: key.slice(0, 7) === anchorMonth,
    isToday: key === todayKey,
    events: byDay.get(key) ?? [],
    weekHref: calendarHref(siteSlug, 'week', key),
  })

  // The notice is about the period on screen, not about the whole grid: a
  // month grid borrows a few days from its neighbours, and those being empty is
  // not "no data for this period".
  const periodStart = view === 'month' ? `${anchorMonth}-01` : grid.startKey
  const periodEnd =
    view === 'month' ? endOfCalendarMonth(anchorKey) : grid.endKey

  const days = grid.days.map(toDay)
  const weeks: Array<CalendarWeek> = grid.weeks.map((week, index) => ({
    key: week[0] ?? String(index),
    days: days.slice(index * 7, index * 7 + 7),
  }))

  return {
    view,
    // Whether the period on screen already contains today, which is what
    // disables the "Today" control: a month view is at today for the whole
    // current month, a week view while today falls inside its seven days.
    isAtToday:
      view === 'month'
        ? anchorMonth === todayKey.slice(0, 7)
        : todayKey >= grid.startKey && todayKey <= grid.endKey,
    periodLabel: formatCalendarPeriod(view, grid, anchorKey),
    periodLabelShort: formatCalendarPeriod(view, grid, anchorKey, true),
    timeZone: CALENDAR_TIME_ZONE,
    weekdayLabels: (grid.weeks[0] ?? []).map((day) =>
      formatCalendarWeekday(day)
    ),
    weeks,
    // Adjacent-month days are on the grid but not in this period, so they do
    // not reach the agenda or the empty-state decision.
    agendaDays: days.filter((day) => day.inPeriod && day.events.length > 0),
    eventCount: days.reduce((total, day) => total + day.events.length, 0),
    dataRange,
    isOutsideData:
      !dataRange || periodEnd < dataRange.from || periodStart > dataRange.to,
    links: {
      previous: calendarHref(
        siteSlug,
        view,
        view === 'month'
          ? addCalendarMonths(anchorKey, -1)
          : shiftDayKey(anchorKey, -7)
      ),
      next: calendarHref(
        siteSlug,
        view,
        view === 'month'
          ? addCalendarMonths(anchorKey, 1)
          : shiftDayKey(anchorKey, 7)
      ),
      today: calendarHref(siteSlug, view, todayKey),
      monthView: calendarHref(siteSlug, 'month', anchorKey),
      weekView: calendarHref(siteSlug, 'week', anchorKey),
    },
  }
}
