import { getScriptSitemapEntries } from '@/lib/api/sitemap-api'
import { ACADEMIC_CATALOG_TAGS } from '@/lib/sanity-tags'
import { studySiteOrigin } from '@/lib/study-origin'
import { subjectStaticParamsQuery } from '@/sanity/queries/academics/subject.queries'
import type { SubjectRouteParams } from '@/types/academics/academics.types'
import { createAcademicStaticParams } from './academic-detail-page'
import {
  MAX_URLS_PER_SITEMAP,
  SCRIPT_SECTION_PREFIX,
  type SitemapSection,
  STUDY_SECTION,
} from './sitemap-sections'
import type { SitemapEntry } from './sitemap-xml'

/**
 * A study host's sitemap: everything served by `lbe.scriptr.uk` and nothing
 * else. The catalog publishes its own index, so neither host lists the other's
 * pages — one address per page is the point of giving a study a hostname.
 */

/** The study's own pages, in one file: its overview, its feed and its subjects. */
const toStudyEntries = async (
  siteSlug: string,
  toUrl: (path: string) => string
): Promise<Array<SitemapEntry>> => {
  const subjects = await createAcademicStaticParams<SubjectRouteParams>(
    subjectStaticParamsQuery,
    `sitemap-study-subjects-${siteSlug}`,
    ACADEMIC_CATALOG_TAGS
  )().catch(() => [])

  return [
    { url: toUrl('/') },
    { url: toUrl('/scripts') },
    ...(subjects ?? [])
      .filter((params) => params.siteSlug === siteSlug && params.subjectSlug)
      .map((params) => ({ url: toUrl(`/subject/${params.subjectSlug}`) })),
  ]
}

/** The study's scripts, paged so no single file approaches the URL limit. A
 * script with no study handle belongs to no site and is left out. */
const toScriptEntries = async (
  siteSlug: string,
  sectionIndex: number,
  toUrl: (path: string) => string
): Promise<Array<SitemapEntry>> => {
  const scripts = await getScriptSitemapEntries()
  const offset = sectionIndex * MAX_URLS_PER_SITEMAP

  return (scripts ?? [])
    .filter((script) => script.study_site_slug === siteSlug)
    .slice(offset, offset + MAX_URLS_PER_SITEMAP)
    .map((script) => ({
      url: toUrl(`/scripts/${script.slug}`),
      lastModified: script.updated_at,
    }))
}

const scriptSectionCount = async (siteSlug: string): Promise<number> => {
  const scripts = await getScriptSitemapEntries()

  return Math.ceil(
    (scripts ?? []).filter((script) => script.study_site_slug === siteSlug)
      .length / MAX_URLS_PER_SITEMAP
  )
}

/** The sections of one study's sitemap index: its pages, then its scripts. */
export const listStudySitemapSections = async (
  siteSlug: string
): Promise<Array<SitemapSection>> => {
  if (!studySiteOrigin(siteSlug)) return []

  const sections: Array<SitemapSection> = [{ id: STUDY_SECTION }]
  const scriptSections = await scriptSectionCount(siteSlug)

  for (let index = 0; index < scriptSections; index += 1) {
    sections.push({ id: `${SCRIPT_SECTION_PREFIX}${index}` })
  }

  return sections
}

/** One section of a study's sitemap, with every URL on the study's own host. */
export const buildStudySitemapSection = async (
  siteSlug: string,
  id: string
): Promise<Array<SitemapEntry>> => {
  const origin = studySiteOrigin(siteSlug)
  if (!origin) return []

  const toUrl = (path: string) => new URL(path, origin).toString()

  if (id === STUDY_SECTION) return toStudyEntries(siteSlug, toUrl)

  if (id.startsWith(SCRIPT_SECTION_PREFIX)) {
    const index = Number(id.slice(SCRIPT_SECTION_PREFIX.length))
    return Number.isInteger(index) && index >= 0
      ? toScriptEntries(siteSlug, index, toUrl)
      : []
  }

  return []
}
