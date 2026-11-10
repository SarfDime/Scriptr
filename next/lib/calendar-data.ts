import { SANITY_CACHE_TAGS } from '@shared/config/cache-tags'
import { fetchSanityData } from '@/sanity/lib/utils'
import { calendarEventsQuery } from '@/sanity/queries/calendar.queries'
import type { CalendarEventRecord } from '@/types/components/Calendar.types'
import { calendarMarginWindow } from './calendar'

/**
 * Every event of every calendar attached to the website, oldest first. One read,
 * cached until the next build like every other Sanity read, shared by
 * `/calendar` and the header alert. The query keeps it to the year around the
 * build (`calendarMarginWindow`), so the payload never grows past that.
 *
 * A failed read throws; the page reports it through its error boundary, and the
 * header alert contains it (`getCalendarAlertEvents`).
 */
export const loadCalendarEvents = async (): Promise<
  Array<CalendarEventRecord>
> => {
  const events = await fetchSanityData<Array<CalendarEventRecord>>({
    query: calendarEventsQuery,
    params: calendarMarginWindow(),
    fetchOrigin: 'calendar-events',
    tags: [SANITY_CACHE_TAGS.calendar],
  })

  // Two attached calendars cannot share a period, but an event can still be
  // referenced twice; one id is one event.
  const byId = new Map<string, CalendarEventRecord>()
  for (const event of events) {
    byId.set(event._id, event)
  }

  return [...byId.values()].sort(
    (left, right) =>
      left.date.localeCompare(right.date) || left._id.localeCompare(right._id)
  )
}
