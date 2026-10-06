import type { PortableTextValue } from '@shared/types/portable-text.types'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageSEO } from '@/components/page-seo/PageSEO'
import { convertToPlainText } from '@/lib/common-utils'
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

/** Fetches the globally shared SEO settings from the Website document. */
export const fetchWebsiteSeoSettings =
  async (): Promise<WebsiteSeoSettings> => {
    const settings = await fetchSanityData<WebsiteSeoSettings | null>({
      query: websiteSeoQuery,
      fetchOrigin: 'website-seo',
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
}: {
  query: string
  params: Record<string, string>
  fetchOrigin: string
}): Promise<TDetail> => {
  const detail = await fetchSanityData<TDetail | null>({
    query,
    params,
    fetchOrigin,
  })

  if (!detail) notFound()

  return detail
}

/** Creates a `generateStaticParams` function for an academic detail route. */
export const createAcademicStaticParams = <
  TParams extends Record<string, string>,
>(
  query: string,
  fetchOrigin: string
) => {
  return async (): Promise<Array<TParams>> => {
    const items = await fetchSanityData<Array<TParams>>({
      query,
      fetchOrigin,
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
  pageDomain,
  entityLabel,
  fetchOriginPrefix,
  getOwnSlug,
  getDescription,
  descriptionFallback,
}: {
  query: string
  seoQuery?: string
  pageDomain: string
  entityLabel: string
  fetchOriginPrefix: string
  /** Pulls the page's own (leaf) slug out of the full route-params object, for logging/SEO param. */
  getOwnSlug: (params: TParams) => string
  getDescription: (detail: TDetail) => PortableTextValue
  descriptionFallback: (detail: TDetail) => string
}) => {
  return async ({
    params,
  }: {
    params: Promise<TParams>
  }): Promise<Metadata> => {
    const routeParams = await params
    const ownSlug = getOwnSlug(routeParams)

    const [detail, websiteSettings] = await Promise.all([
      fetchSanityData<TDetail | null>({
        query: seoQuery,
        params: routeParams,
        fetchOrigin: `${fetchOriginPrefix}-metadata-${ownSlug}`,
      }).catch(() => null),
      fetchWebsiteSeoSettings(),
    ])

    if (!detail) {
      return {
        title: `${entityLabel} Not Found | ${websiteSettings.siteName ?? 'Scriptr'}`,
      }
    }

    const seoDescription =
      convertToPlainText({ value: getDescription(detail) }) ||
      descriptionFallback(detail)

    return PageSEO({
      seoTitle: `${detail.name} | ${websiteSettings.siteName ?? 'Scriptr'}`,
      seoDescription,
      pageDomain,
      param: ownSlug,
      siteName: websiteSettings.siteName,
      siteUrl: websiteSettings.siteUrl,
      keywords: websiteSettings.defaultKeywords,
    })
  }
}
