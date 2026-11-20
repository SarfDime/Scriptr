import { CALENDAR_STRINGS_PACK } from '@shared/strings/calendar-strings'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { CalendarScreen } from '@/components/calendar/CalendarScreen'
import { CalendarScreenSkeleton } from '@/components/calendar/CalendarScreenSkeleton'
import { getStudySiteUrl } from '@/lib/academic-routes'
import {
  type CalendarSearchParams,
  loadCalendarPage,
} from '@/lib/calendar-page'
import { languageAlternates } from '@/lib/localized-metadata'
import { getServerStrings } from '@/lib/server-strings'
import { getStudySiteOrNotFound } from '@/lib/study-site'
import type { LocalePageProps } from '@/types/localization.types'

export async function generateMetadata({
  params,
}: {
  params: LocalePageProps<{ siteSlug: string }>['params']
}): Promise<Metadata> {
  const { siteSlug, locale } = await params
  const CALENDAR_STRINGS = await getServerStrings(CALENDAR_STRINGS_PACK, locale)
  const path = `${getStudySiteUrl(siteSlug, locale)}/calendar`

  return {
    title: CALENDAR_STRINGS.pageTitle,
    description: CALENDAR_STRINGS.metaDescription,
    // Every period links to the next one, so the crawlable address space is
    // unbounded and each step is a render. The page itself is followed so its
    // subject and professor links still lead a crawler on.
    robots: { index: false, follow: true },
    alternates: {
      canonical: path,
      languages: languageAlternates(path),
    },
  }
}

/**
 * A calendar belongs to a study, so it is served inside that study's site and
 * nowhere else. Thin: the loader validates `?view`/`?date`, reads the visible
 * window from that study's calendars and hands back a view model.
 *
 * The period is in the URL and the grid is relative to today, so the whole
 * screen is request-time; the study's chrome above it is prerendered.
 */
export default function StudyCalendarPage({
  params,
  searchParams,
}: LocalePageProps<{ siteSlug: string }> & {
  searchParams: Promise<CalendarSearchParams>
}) {
  return (
    <Suspense fallback={<CalendarScreenSkeleton />}>
      <CalendarPeriod params={params} searchParams={searchParams} />
    </Suspense>
  )
}

async function CalendarPeriod({
  params,
  searchParams,
}: LocalePageProps<{ siteSlug: string }> & {
  searchParams: Promise<CalendarSearchParams>
}) {
  const [{ siteSlug }, period] = await Promise.all([params, searchParams])
  await getStudySiteOrNotFound(siteSlug)

  const viewModel = await loadCalendarPage(siteSlug, period)

  return <CalendarScreen {...viewModel} />
}
