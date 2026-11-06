import { CALENDAR_STRINGS } from '@shared/strings/calendar-strings'
import type { Metadata } from 'next'
import { CalendarScreen } from '@/components/calendar/CalendarScreen'
import {
  type CalendarSearchParams,
  loadCalendarPage,
} from '@/lib/calendar-page'

export const metadata: Metadata = {
  title: CALENDAR_STRINGS.pageTitle,
  description: CALENDAR_STRINGS.metaDescription,
}

/** Open to everyone, and thin: the loader validates `?view`/`?date`, reads the
 * visible window from Sanity and hands back a view model. No segment config —
 * the page reads `searchParams`, so it must stay dynamic. */
export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<CalendarSearchParams>
}) {
  const viewModel = await loadCalendarPage(await searchParams)

  return <CalendarScreen {...viewModel} />
}
