import { SANITY_CACHE_TAGS } from '@shared/config/cache-tags'
import { UI_STRINGS } from '@shared/config/strings'
import type { PortableTextValue } from '@shared/types/portable-text.types'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageSEO } from '@/components/page-seo/PageSEO'
import { convertToPlainText } from '@/lib/common-utils'
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

/** Creates a `generateMetadata` function for an academic detail route, backed by `PageSEO`. */
export const createAcademicMetadata = <
  TDetail extends { name: string },
  TParams extends Record<string, string> = { slug: string },
>({
  query,
  seoQuery = query,
  resolveQueryParams,
  getPath,
  entityLabel,
  fetchOriginPrefix,
  getOwnSlug,
  getDescription,
  descriptionFallback,
  titleTemplate,
  tags,
}: {
  query: string
  seoQuery?: string
  /**
   * Maps the route's params to the query's params when the two differ — a study
   * site knows only its handle, while the shared queries take the slug tuple.
   * Returning `null` means the route does not exist.
   */
  resolveQueryParams?: (
    params: TParams
  ) => Promise<Record<string, string> | null>
  /**
   * The page's own site-relative path, built from the route params with
   * `getAcademicPath`. It must equal the URL the route is served at, since it
   * becomes the canonical and the Open Graph URL.
   */
  getPath: (params: TParams) => string
  entityLabel: string
  fetchOriginPrefix: string
  /** Pulls the page's own (leaf) slug out of the full route-params object, for logging/SEO param. */
  getOwnSlug: (params: TParams) => string
  /** The entity's rich-text description, flattened into the meta description.
   * Omitted by a sub-page of the entity (a study's script feed), which has a
   * description of its own rather than the parent's. */
  getDescription?: (detail: TDetail) => PortableTextValue
  descriptionFallback: (detail: TDetail) => string
  /** The title without the site name. Defaults to the entity's name; a sub-page
   * of the entity passes its own so two pages of one entity do not share a
   * title. */
  titleTemplate?: (detail: TDetail) => string
  tags?: ReadonlyArray<string>
}) => {
  return async ({
    params,
  }: {
    params: Promise<TParams>
  }): Promise<Metadata> => {
    const routeParams = await params
    const ownSlug = getOwnSlug(routeParams)
    const queryParams = resolveQueryParams
      ? await resolveQueryParams(routeParams)
      : routeParams

    const [detail, websiteSettings] = await Promise.all([
      queryParams
        ? fetchSanityData<TDetail | null>({
            query: seoQuery,
            params: queryParams,
            fetchOrigin: `${fetchOriginPrefix}-metadata-${ownSlug}`,
            tags,
          }).catch(() => null)
        : Promise.resolve(null),
      fetchWebsiteSeoSettings(),
    ])

    if (!detail) {
      return {
        title: UI_STRINGS.academics.metadata.notFoundTitle(
          entityLabel,
          websiteSettings.siteName ?? 'Scriptr'
        ),
      }
    }

    const seoDescription =
      convertToPlainText({
        value: getDescription ? getDescription(detail) : undefined,
      }) || descriptionFallback(detail)

    return PageSEO({
      seoTitle: `${titleTemplate ? titleTemplate(detail) : detail.name} | ${
        websiteSettings.siteName ?? 'Scriptr'
      }`,
      seoDescription,
      pagePath: getPath(routeParams),
      siteName: websiteSettings.siteName,
      siteUrl: websiteSettings.siteUrl,
      keywords: websiteSettings.defaultKeywords,
    })
  }
}
