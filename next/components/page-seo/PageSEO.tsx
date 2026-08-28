import { generatePathWithTrailingSlash } from '../../lib/common-utils'
import type { PageDomainType } from '../../types/common.types'

type PageSEOProps = {
  seoTitle?: string
  seoDescription?: string
  seoImage?: string
  seoImageAlt?: string
  siteName?: string
  twitterCardType?: string
  twitterCreator?: string
  twitterSite?: string
  openGraphType?: string
  param?: string
  keywords?: Array<string>
} & PageDomainType

/**
 * - PageSEO component that adds the NextSeo component from next-seo package
 * - It is used to provide information about the page to search engines.
 */
export function PageSEO({
  seoImage,
  seoDescription,
  seoTitle,
  seoImageAlt,
  pageDomain = '',
  siteName,
  twitterCardType,
  twitterCreator,
  twitterSite,
  openGraphType,
  param,
  keywords,
}: PageSEOProps) {
  const url: string = param
    ? `${generatePathWithTrailingSlash({ segments: [pageDomain, param] })}`
    : `${generatePathWithTrailingSlash({ segments: [pageDomain], endsWithSlash: true })}`
  return {
    title: seoTitle,
    description: seoDescription,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: `${openGraphType}` || 'website',
      url,
      title: seoTitle ?? 'Tontine Trust',
      description: seoDescription ?? '',
      images: [
        {
          url: seoImage ?? '',
          width: 1200,
          height: 630,
          alt: seoImageAlt || 'Tontine Trust',
        },
      ],
      siteName: `${siteName}`,
    },
    twitter: {
      card: `${twitterCardType}` || 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      site: `${twitterSite}`,
      creator: `${twitterCreator}`,
      images: [
        {
          url: seoImage || '',
          width: 1200,
          height: 630,
          alt: seoImageAlt || 'Tontine Trust',
        },
      ],
    },
    keywords: keywords?.join(', ').toLowerCase(),
  }
}
