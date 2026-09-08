import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageSEO } from '@/components/page-seo/PageSEO'
import { convertToPlainText } from '@/lib/common-utils'
import { fetchSanityData } from '@/sanity/lib/utils'
import { websiteSeoQuery } from '@/sanity/queries/website.queries'
import type { AcademicDetailPageProps } from '@/types/academics.types'
import type { PortableTextType } from '@/types/components/PortableText.types'

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

/** Fetches a single academic entity by slug, triggering a 404 when missing. */
export const fetchAcademicDetailOrNotFound = async <TDetail>({
  query,
  slug,
  fetchOrigin,
}: {
  query: string
  slug: string
  fetchOrigin: string
}): Promise<TDetail> => {
  const detail = await fetchSanityData<TDetail | null>({
    query,
    params: { slug },
    fetchOrigin,
  })

  if (!detail) notFound()

  return detail
}

/** Creates a `generateStaticParams` function for an academic detail route. */
export const createAcademicStaticParams = (
  query: string,
  fetchOrigin: string
) => {
  return async (): Promise<Array<{ slug: string }>> => {
    const items = await fetchSanityData<Array<{ slug: string }>>({
      query,
      fetchOrigin,
    }).catch(() => [])

    return items ?? []
  }
}

/** Creates a `generateMetadata` function for an academic detail route, backed by `PageSEO`. */
export const createAcademicMetadata = <TDetail extends { name: string }>({
  query,
  seoQuery = query,
  pageDomain,
  entityLabel,
  fetchOriginPrefix,
  getDescription,
  descriptionFallback,
}: {
  query: string
  seoQuery?: string
  pageDomain: string
  entityLabel: string
  fetchOriginPrefix: string
  getDescription: (detail: TDetail) => PortableTextType | undefined
  descriptionFallback: (detail: TDetail) => string
}) => {
  return async ({ params }: AcademicDetailPageProps): Promise<Metadata> => {
    const { slug } = await params
    const [detail, websiteSettings] = await Promise.all([
      fetchSanityData<TDetail | null>({
        query: seoQuery,
        params: { slug },
        fetchOrigin: `${fetchOriginPrefix}-metadata-${slug}`,
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
      param: slug,
      siteName: websiteSettings.siteName,
      siteUrl: websiteSettings.siteUrl,
      keywords: websiteSettings.defaultKeywords,
    })
  }
}
