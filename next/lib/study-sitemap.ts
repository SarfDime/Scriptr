import { getScriptSitemapEntries } from '@/lib/api/sitemap-api'
import { languageAlternates } from '@/lib/localized-metadata'
import { ACADEMIC_CATALOG_TAGS } from '@/lib/sanity-tags'
import { toSitemapIndexXml } from '@/lib/sitemap-xml'
import { studySiteOrigin } from '@/lib/study-origin'
import { studyStaticParamsQuery } from '@/sanity/queries/academics/study.queries'
import { subjectStaticParamsQuery } from '@/sanity/queries/academics/subject.queries'
import type {
  StudyRouteParams,
  SubjectRouteParams,
} from '@/types/academics/academics.types'
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
 *
 * One entry per page, publishing the other language as an `alternate` — the
 * study's host serves both shapes, so both addresses resolve.
 */

/**
 * The studies that own a site, i.e. the hosts that publish a sitemap.
 *
 * Read at build time by `generateStaticParams`. It must not be left out: without
 * it Next prerenders the route once with `-` as the parameter, and every study
 * host is then served that placeholder's body — an empty 404.
 */
export const listStudySites = async (): Promise<Array<string>> => {
  const studies = await createAcademicStaticParams<StudyRouteParams>(
    studyStaticParamsQuery,
    'sitemap-study-sites',
    ACADEMIC_CATALOG_TAGS
  )().catch(() => [])

  return [
    ...new Set(
      (studies ?? []).flatMap((study) =>
        study.siteSlug ? [study.siteSlug] : []
      )
    ),
  ]
}

/** One entry per page: the address on the study's host plus each language's
 * address. */
const toEntry = (
  path: string,
  toUrl: (path: string) => string,
  lastModified?: string
): SitemapEntry => {
  const url = toUrl(path)
  return { url, lastModified, alternates: languageAlternates(url) }
}

/** A study's own pages, in one file: its overview, its feed and its subjects. */
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
    toEntry('/', toUrl),
    toEntry('/scripts', toUrl),
    ...(subjects ?? [])
      .filter((params) => params.siteSlug === siteSlug && params.subjectSlug)
      .map((params) => toEntry(`/subject/${params.subjectSlug}`, toUrl)),
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
    .map((script) =>
      toEntry(`/scripts/${script.slug}`, toUrl, script.updated_at)
    )
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

/** The name the index is served under. It goes through the section route
 * because a study host's `/sitemap.xml` has to be rewritten onto a path an app
 * route handler owns: an extension-less handler path is shadowed by the
 * `[locale]` catch-all, while a `<section>.xml` path resolves to this route
 * directly. */
export const STUDY_SITEMAP_INDEX_SECTION = 'index'

/**
 * A study's sitemap index: one entry point a crawler can submit, listing this
 * study's sections on its own host.
 */
export const buildStudySitemapIndex = async (
  siteSlug: string
): Promise<string> => {
  const origin = studySiteOrigin(siteSlug)
  if (!origin) return ''

  const sections = await listStudySitemapSections(siteSlug)

  return toSitemapIndexXml(
    sections.map((section) =>
      new URL(`/sitemap/${section.id}.xml`, origin).toString()
    )
  )
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
