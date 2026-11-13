import { SANITY_CACHE_TAGS } from '@shared/config/cache-tags'
import { nextLogs } from '@/lib/logger'
import { fetchSanityData } from '@/sanity/lib/utils'
import { studyAlertSubjectsQuery } from '@/sanity/queries/academics/study.queries'
import type {
  CalendarAlertEvent,
  CalendarAlertSubject,
} from '@/types/components/Calendar.types'
import { loadCalendarEvents } from './calendar-data'

/**
 * Everything a study's header alert can act on, from the same build-time
 * calendar read its page uses — no second query, no upper bound, no user logic. The narrowing
 * to "the next few days" and to this reader's subjects happens on the client,
 * where the session lives.
 *
 * Wrapped like `getStudyTipRotation`: a Sanity failure logs (inside
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

/**
 * The subjects a study's calendar alert matches events against, with their
 * database ids. Read on the server alongside the events, so the alert needs no
 * catalog of its own — it used to fetch the whole one to answer two questions
 * about one study.
 *
 * A failed read yields no subjects: the alert then shows only the global
 * events, which is also what a signed-out reader sees.
 */
export const getCalendarAlertSubjects = async (
  siteSlug: string
): Promise<Array<CalendarAlertSubject>> => {
  try {
    const subjects = await fetchSanityData<Array<CalendarAlertSubject>>({
      query: studyAlertSubjectsQuery,
      params: { siteSlug },
      fetchOrigin: `study-alert-subjects-${siteSlug}`,
      tags: [SANITY_CACHE_TAGS.subject],
    })

    return (subjects ?? []).flatMap((subject) =>
      subject.dbId ? [{ dbId: subject.dbId, name: subject.name }] : []
    )
  } catch (error) {
    nextLogs({
      message: `Calendar alert subjects for ${siteSlug} could not be read.`,
      logLevel: 'warn',
      error,
    })
    return []
  }
}
