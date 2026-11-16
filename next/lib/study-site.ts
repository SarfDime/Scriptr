import { SANITY_CACHE_TAGS } from '@shared/config/cache-tags'
import type { StudySiteQueryResult } from '@shared/types/sanity.types'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { createAcademicStaticParams } from '@/lib/academic-detail-page'
import { ACADEMIC_CATALOG_TAGS } from '@/lib/sanity-tags'
import { getServerLocale } from '@/lib/server-strings'
import { fetchSanityData } from '@/sanity/lib/utils'
import {
  studySiteQuery,
  studyStaticParamsQuery,
} from '@/sanity/queries/academics/study.queries'
import type { StudyRouteParams } from '@/types/academics/academics.types'

/** The catalog identity behind one site handle: the slug tuple the shared
 * academic queries take, so a `/study/[siteSlug]` route can reuse them. */
export type StudySite = NonNullable<StudySiteQueryResult>

/**
 * Resolves a study from its site handle. `cache`-wrapped so the layout and the
 * page below it share one read per request.
 *
 * A `null` result is a real "no such study" (the handle is unknown or the study
 * was never given one). A Sanity failure throws instead, so an outage shows an
 * error rather than pretending the site does not exist.
 */
export const getStudySite = cache(
  async (siteSlug: string): Promise<StudySite | null> =>
    fetchSanityData<StudySiteQueryResult>({
      query: studySiteQuery,
      params: { siteSlug },
      locale: await getServerLocale(),
      fetchOrigin: `study-site-${siteSlug}`,
      tags: [SANITY_CACHE_TAGS.study],
    })
)

/**
 * The studies that own a site, i.e. the handles that get a hostname of their own.
 *
 * Read at build time to list the study tree's static params and the study
 * sitemaps. The sitemap route handler must not leave it out: without it Next
 * prerenders that route once with `-` as the parameter, and every study host is
 * served the placeholder's body.
 */
export const listStudySites = async (): Promise<Array<string>> => {
  const studies = await createAcademicStaticParams<StudyRouteParams>(
    studyStaticParamsQuery,
    'study-sites',
    ACADEMIC_CATALOG_TAGS
  )()

  return [
    ...new Set(
      studies.flatMap((study) => (study.siteSlug ? [study.siteSlug] : []))
    ),
  ]
}

export const getStudySiteOrNotFound = async (
  siteSlug: string
): Promise<StudySite> => {
  const site = await getStudySite(siteSlug)
  if (!site) notFound()
  return site
}
