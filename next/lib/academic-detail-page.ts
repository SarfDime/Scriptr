import { SANITY_CACHE_TAGS } from '@shared/config/cache-tags'
import { notFound } from 'next/navigation'
import { getServerLocale } from '@/lib/server-strings'
import { websiteDomain } from '@/sanity/env'
import { fetchSanityData } from '@/sanity/lib/utils'
import { websiteSeoQuery } from '@/sanity/queries/website.queries'

export type WebsiteSeoSettings = {
  siteName?: string
  siteUrl?: string
  defaultSeoTitle?: string
  defaultSeoDescription?: string
  defaultKeywords?: Array<string>
}

const fallbackWebsiteSeo: WebsiteSeoSettings = {
  siteName: 'Scriptr',
  siteUrl: 'https://localhost:3000',
  defaultSeoTitle: 'Scriptr',
  defaultSeoDescription: 'Academic information and faculty resources.',
  defaultKeywords: ['academics', 'university', 'faculty', 'courses'],
}

/**
 * `metadataBase` has to be a valid absolute URL, and `website.siteUrl` is free
 * text typed in the Studio. Anything that does not parse falls back to the
 * environment's origin, and if neither is usable the key is left out so Next
 * skips it instead of throwing during a render.
 */
export const toOrigin = (value: string | undefined): URL | undefined => {
  for (const candidate of [value, websiteDomain]) {
    if (!candidate) continue
    try {
      return new URL(candidate)
    } catch {
      // Not a URL: try the next source.
    }
  }
  return undefined
}

/** Fetches the globally shared SEO settings from the Website document. */
export const fetchWebsiteSeoSettings =
  async (): Promise<WebsiteSeoSettings> => {
    const settings = await fetchSanityData<WebsiteSeoSettings | null>({
      query: websiteSeoQuery,
      fetchOrigin: 'website-seo',
      tags: [SANITY_CACHE_TAGS.website],
    }).catch(() => null)

    return settings ?? fallbackWebsiteSeo
  }

/**
 * Fetches a single academic entity, triggering a 404 when missing.
 * `params` is passed straight through as GROQ params, so its keys must match
 * the `$paramName` placeholders used in `query` (e.g. `{ universitySlug, facultySlug }`).
 */
export const fetchAcademicDetailOrNotFound = async <TDetail>({
  query,
  params,
  fetchOrigin,
  tags,
}: {
  query: string
  params: Record<string, string>
  fetchOrigin: string
  tags?: ReadonlyArray<string>
}): Promise<TDetail> => {
  const detail = await fetchSanityData<TDetail | null>({
    query,
    params,
    locale: await getServerLocale(),
    fetchOrigin,
    tags,
  })

  if (!detail) notFound()

  return detail
}

/** Creates a `generateStaticParams` function for an academic detail route. */
export const createAcademicStaticParams = <
  TParams extends Record<string, string>,
>(
  query: string,
  fetchOrigin: string,
  tags?: ReadonlyArray<string>
) => {
  return async (): Promise<Array<TParams>> => {
    const items = await fetchSanityData<Array<TParams>>({
      query,
      fetchOrigin,
      tags,
    }).catch(() => [])

    return items ?? []
  }
}
