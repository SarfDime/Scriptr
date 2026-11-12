import { nextLogs } from '@/lib/logger'
import { websiteDomain } from '@/sanity/env'

/** sitemaps.org: one file holds at most 50,000 URLs. */
export const MAX_URLS_PER_SITEMAP = 50_000

/** A section is a full file under `/sitemap/<id>.xml`. */
export type SitemapSection = { id: string }

export const CATALOG_SECTION = 'catalog'
/** A study's overview and subject pages: one section per study host. */
export const STUDY_SECTION = 'study'
/** A page of the scripts a study owns; the suffix is the page index. */
export const SCRIPT_SECTION_PREFIX = 'scripts-'

/**
 * The catalog host's sitemap index. Studies are not listed: each one is served
 * by its own host, which publishes its own index (see `lib/study-sitemap.ts`),
 * so the catalog has nothing left to split.
 */
export const listSitemapSections = async (): Promise<Array<SitemapSection>> => [
  { id: CATALOG_SECTION },
]

/** Without the site origin every URL would be relative, or built on the wrong
 * domain, so publish nothing rather than a sitemap crawlers must reject. */
export const hasSiteOrigin = (): boolean => {
  if (websiteDomain) return true

  nextLogs({
    logLevel: 'warn',
    message:
      'NEXT_PUBLIC_SITE_URL is not set; /sitemap.xml is empty because its URLs need the site origin.',
  })
  return false
}
