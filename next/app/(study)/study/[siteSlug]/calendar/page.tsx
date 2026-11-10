import { CALENDAR_STRINGS } from '@shared/strings/calendar-strings'
import type { Metadata } from 'next'
import { CalendarScreen } from '@/components/calendar/CalendarScreen'
import {
  type CalendarSearchParams,
  loadCalendarPage,
} from '@/lib/calendar-page'
import { getStudySiteOrNotFound } from '@/lib/study-site'

export const metadata: Metadata = {
  title: CALENDAR_STRINGS.pageTitle,
  description: CALENDAR_STRINGS.metaDescription,
}

/** A calendar belongs to a study, so it is served inside that study's site and
 * nowhere else. Thin: the loader validates `?view`/`?date`, reads the visible
 * window from that study's calendars and hands back a view model. No segment
 * config — the page reads `searchParams`, so it must stay dynamic. */
export default async function StudyCalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ siteSlug: string }>
  searchParams: Promise<CalendarSearchParams>
}) {
  const { siteSlug } = await params
  await getStudySiteOrNotFound(siteSlug)

  const viewModel = await loadCalendarPage(siteSlug, await searchParams)

  return <CalendarScreen {...viewModel} />
}
