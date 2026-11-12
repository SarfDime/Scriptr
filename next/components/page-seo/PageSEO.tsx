import { generatePath } from '@shared/utils/common-utils'
import type { Metadata } from 'next'
import { websiteDomain } from '@/sanity/env'

const isAbsoluteUrl = (value: string): boolean => {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

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
  /** The page's own address, built with `getAcademicPath`: a site-relative path
   * for a catalog page, an absolute URL for a page inside a study's site. It
   * becomes the canonical and the Open Graph URL, so it has to be the URL the
   * page is actually served at — the study's own host included. */
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
  // A study's pages are addressed by their own host, so `pagePath` is already
  // absolute there and must not be re-based onto the catalog origin.
  const url = isAbsoluteUrl(pagePath)
    ? pagePath
    : new URL(canonicalPath, baseUrl).toString()

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
