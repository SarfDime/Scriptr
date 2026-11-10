import type { CalendarAlertEvent } from '@/types/components/Calendar.types'
import { loadCalendarEvents } from './calendar-data'

/**
 * Everything a study's header alert can act on, from the same build-time
 * calendar read its page uses — no second query, no upper bound, no user logic. The narrowing
 * to "the next few days" and to this reader's subjects happens on the client,
 * where the session lives.
 *
 * Wrapped like `getDailyStudyTip`: a Sanity failure logs (inside
 * `fetchSanityData`) and renders no alert, rather than taking the whole site
 * down from the layout.
 */
export const getCalendarAlertEvents = async (
  siteSlug: string
): Promise<Array<CalendarAlertEvent>> => {
  try {
    const records = await loadCalendarEvents(siteSlug)

    return records.map((record) => ({
      id: record._id,
      title: record.title,
      date: record.date,
      type: record.type,
      importance: record.importance,
      subjectDbId: record.subject?.dbId ?? null,
    }))
  } catch {
    return []
  }
}
