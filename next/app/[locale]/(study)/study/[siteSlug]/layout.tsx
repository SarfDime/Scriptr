import type { ReactNode } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { listStudySites } from '@/lib/study-site'

export const generateStaticParams = async (): Promise<
  Array<{ siteSlug: string }>
> => (await listStudySites()).map((siteSlug) => ({ siteSlug }))

/**
 * The frame of one study's site — chrome included, so the header can carry that
 * study's calendar alert and scope its search to the study's own scripts.
 *
 * The two parts of the chrome that need the handle (the alert and the search
 * scope) resolve it in their own boundaries (`components/navigation/StudyChrome`),
 * so this layout never waits for the URL: the frame is the same for every study,
 * and a page below it keeps its own shell.
 *
 * Every route below needs the handle, so it is enumerated here once instead of
 * in each page: a study that owns a site gets its chrome prerendered for its
 * whole tree, and a study added between two deploys renders on demand. The
 * existence check lives in the pages, which all resolve the study themselves.
 */
export default function StudySiteLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ siteSlug: string }>
}) {
  return <MainLayout studySiteParams={params}>{children}</MainLayout>
}
