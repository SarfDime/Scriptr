import { SANITY_CACHE_TAGS } from '@shared/config/cache-tags'
import { cacheLife } from 'next/cache'
import { getServerLocale } from '@/lib/server-strings'
import { fetchSanityData } from '@/sanity/lib/utils'
import { calendarEventsQuery } from '@/sanity/queries/calendar.queries'
import type { CalendarEventRecord } from '@/types/components/Calendar.types'
import { calendarMarginWindow } from './calendar'

/**
 * The window the events query is bounded to, as a cached value: it reads the
 * clock, and the study layout renders on every page under it, so an uncached
 * `new Date()` there would fail the prerender of the whole study tree. Cached,
 * the window is the build's (or the revalidation's) now, which is what
 * `calendarMarginWindow` already means.
 */
const readCalendarWindow = async (): Promise<{ from: string; to: string }> => {
  'use cache'
  cacheLife('max')

  return calendarMarginWindow()
}

/**
 * Every event of every calendar attached to one study, oldest first. One read,
 * cached until the next build like every other Sanity read, shared by the
 * study's calendar page and its header alert. The query keeps it to the year
 * around the build (`calendarMarginWindow`), so the payload never grows past
 * that.
 *
 * A failed read throws; the page reports it through its error boundary, and the
 * header alert contains it (`getCalendarAlertEvents`).
 */
export const loadCalendarEvents = async (
  siteSlug: string
): Promise<Array<CalendarEventRecord>> => {
  const events = await fetchSanityData<Array<CalendarEventRecord>>({
    query: calendarEventsQuery,
    params: { ...(await readCalendarWindow()), siteSlug },
    locale: await getServerLocale(),
    fetchOrigin: `calendar-events-${siteSlug}`,
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
