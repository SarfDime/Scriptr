import { SANITY_CACHE_TAGS } from '@shared/config/cache-tags'
import type { StudySiteQueryResult } from '@shared/types/sanity.types'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { getServerLocale } from '@/lib/server-strings'
import { fetchSanityData } from '@/sanity/lib/utils'
import { studySiteQuery } from '@/sanity/queries/academics/study.queries'

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

export const getStudySiteOrNotFound = async (
  siteSlug: string
): Promise<StudySite> => {
  const site = await getStudySite(siteSlug)
  if (!site) notFound()
  return site
}
