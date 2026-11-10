import { getScriptSitemapEntries } from '@/lib/api/sitemap-api'
import { nextLogs } from '@/lib/logger'
import { ACADEMIC_CATALOG_TAGS } from '@/lib/sanity-tags'
import { websiteDomain } from '@/sanity/env'
import { studyStaticParamsQuery } from '@/sanity/queries/academics/study.queries'
import type { StudyRouteParams } from '@/types/academics/academics.types'
import { createAcademicStaticParams } from './academic-detail-page'

/** sitemaps.org: one file holds at most 50,000 URLs. */
export const MAX_URLS_PER_SITEMAP = 50_000

export const CATALOG_SECTION = 'catalog'
export const STUDY_SECTION_PREFIX = 'study-'
export const SCRIPT_SECTION_PREFIX = 'scripts-'

export type SitemapSection = { id: string }

/** One study's identifier: its slugs are only unique among siblings, so the
 * whole tuple decides which study a subject belongs to. */
export const studyKey = (params: StudyRouteParams): string =>
  `${params.universitySlug}/${params.facultySlug}/${params.studySlug}`

/**
 * Studies in a stable order. `study-<n>` ids are positions in this list, so the
 * section list and the section it serves must derive the same order.
 */
export const listStudies = async (): Promise<Array<StudyRouteParams>> => {
  const studies = await createAcademicStaticParams<StudyRouteParams>(
    studyStaticParamsQuery,
    'sitemap-studies',
    ACADEMIC_CATALOG_TAGS
  )().catch(() => [])

  return [...(studies ?? [])].sort((left, right) =>
    studyKey(left).localeCompare(studyKey(right))
  )
}

/**
 * The sitemap index, split so no single file approaches the protocol's URL
 * limit and so the catalog, each study's subjects and the scripts are
 * independent: `catalog`, `study-<n>` and `scripts-<n>`.
 */
export const listSitemapSections = async (): Promise<Array<SitemapSection>> => {
  if (!websiteDomain) return [{ id: CATALOG_SECTION }]

  const [studies, scripts] = await Promise.all([
    listStudies(),
    getScriptSitemapEntries(),
  ])

  const sections: Array<SitemapSection> = [{ id: CATALOG_SECTION }]

  for (let index = 0; index < studies.length; index += 1) {
    sections.push({ id: `${STUDY_SECTION_PREFIX}${index}` })
  }

  const scriptSections = Math.ceil(
    (scripts?.length ?? 0) / MAX_URLS_PER_SITEMAP
  )
  for (let index = 0; index < scriptSections; index += 1) {
    sections.push({ id: `${SCRIPT_SECTION_PREFIX}${index}` })
  }

  return sections
}

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
