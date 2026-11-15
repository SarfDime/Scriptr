import type { ReactNode } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { getStudySiteUrl } from '@/lib/academic-routes'
import {
  getCalendarAlertEvents,
  getCalendarAlertSubjects,
} from '@/lib/calendar-alert'
import { getServerLocale } from '@/lib/server-strings'
import { getStudySiteOrNotFound } from '@/lib/study-site'

/**
 * The frame of one study's site — chrome included, so the header can carry that
 * study's calendar alert.
 *
 * A calendar belongs to a study, and this layout is the nearest place that knows
 * which one: it resolves the handle and reads the study's events on the server,
 * so the header needs no request-time read and the study's pages stay static.
 * The catalog tree has its own chrome without an alert.
 *
 * `getStudySiteOrNotFound` is `cache`-wrapped, so the page's own resolve costs
 * nothing.
 */
export default async function StudySiteLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ siteSlug: string }>
}) {
  const { siteSlug } = await params
  const locale = await getServerLocale()
  await getStudySiteOrNotFound(siteSlug)

  const [calendarAlertEvents, calendarAlertSubjects] = await Promise.all([
    getCalendarAlertEvents(siteSlug),
    getCalendarAlertSubjects(siteSlug),
  ])

  return (
    <MainLayout
      calendarAlert={{
        events: calendarAlertEvents,
        subjects: calendarAlertSubjects,
        calendarHref: `${getStudySiteUrl(siteSlug, locale)}/calendar`,
      }}
    >
      {children}
    </MainLayout>
  )
}
