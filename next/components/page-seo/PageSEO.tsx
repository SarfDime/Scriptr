import { generatePath } from '@shared/utils/common-utils'
import type { Metadata } from 'next'
import { websiteDomain } from '@/sanity/env'

type OpenGraphType = 'website' | 'article' | 'profile'
type TwitterCardType = 'summary' | 'summary_large_image' | 'player' | 'app'

type PageSEOProps = {
  seoTitle?: string
  seoDescription?: string
  seoImage?: string
  seoImageAlt?: string
  siteName?: string
  siteUrl?: string
  twitterCardType?: TwitterCardType
  twitterCreator?: string
  twitterSite?: string
  openGraphType?: OpenGraphType
  keywords?: Array<string>
  /** Site-relative path of the page, built with `getAcademicPath`. It becomes
   * the canonical and the Open Graph URL, so it has to be the URL the route is
   * actually served at — parent segments and the singular `/university` prefix
   * included. */
  pagePath: string
}

/** Builds Next.js metadata using the site origin plus the route path relative to the root. */
export function PageSEO({
  seoImage,
  seoDescription,
  seoTitle,
  seoImageAlt,
  siteName = 'Scriptr',
  siteUrl,
  twitterCardType = 'summary_large_image',
  twitterCreator,
  twitterSite,
  openGraphType = 'website',
  keywords,
  pagePath,
}: PageSEOProps): Metadata {
  const baseUrl = siteUrl || websiteDomain || 'https://localhost:3000'
  const canonicalPath = generatePath({
    segments: [pagePath],
    leadingSlash: true,
  })
  const url = new URL(canonicalPath, baseUrl).toString()

  const images = seoImage
    ? [
        {
          url: seoImage,
          width: 1200,
          height: 630,
          alt: seoImageAlt || siteName,
        },
      ]
    : undefined

  return {
    title: seoTitle,
    description: seoDescription,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: openGraphType,
      url,
      title: seoTitle ?? siteName,
      description: seoDescription ?? '',
      images,
      siteName,
    },
    twitter: {
      card: twitterCardType,
      title: seoTitle,
      description: seoDescription,
      site: twitterSite,
      creator: twitterCreator,
      images,
    },
    keywords: keywords?.join(', ').toLowerCase(),
  }
}
