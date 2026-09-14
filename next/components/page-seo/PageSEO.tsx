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
  param?: string
  keywords?: Array<string>
  pageDomain?: string
  pagePath?: string
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
  param,
  keywords,
  pageDomain,
  pagePath,
}: PageSEOProps): Metadata {
  const routePath = pagePath ?? pageDomain ?? ''
  const baseUrl = siteUrl || websiteDomain || 'https://localhost:3000'
  const segments: Array<string> = [routePath, param].filter(
    (segment): segment is string => Boolean(segment)
  )
  const canonicalPath = generatePath({
    segments,
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
