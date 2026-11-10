import { createAcademicStaticParams } from '@/lib/academic-detail-page'
import { getAcademicPath } from '@/lib/academic-routes'
import { getScriptSitemapEntries } from '@/lib/api/sitemap-api'
import { ACADEMIC_CATALOG_TAGS } from '@/lib/sanity-tags'
import {
  CATALOG_SECTION,
  hasSiteOrigin,
  listStudies,
  listStudySites,
  MAX_URLS_PER_SITEMAP,
  SCRIPT_SECTION_PREFIX,
  STUDY_SECTION_PREFIX,
  studyKey,
} from '@/lib/sitemap-sections'
import { websiteDomain } from '@/sanity/env'
import { facultyStaticParamsQuery } from '@/sanity/queries/academics/faculty.queries'
import { professorStaticParamsQuery } from '@/sanity/queries/academics/professor.queries'
import { subjectStaticParamsQuery } from '@/sanity/queries/academics/subject.queries'
import { universityStaticParamsQuery } from '@/sanity/queries/academics/university.queries'
import type {
  FacultyRouteParams,
  ProfessorRouteParams,
  StudyRouteParams,
  SubjectRouteParams,
  UniversityRouteParams,
} from '@/types/academics/academics.types'

/** One address in a section. */
export type SitemapEntry = {
  url: string
  lastModified?: string | Date
}

/** A static-params row with a missing parent slug would build a broken path. */
function isComplete(params: Record<string, string>): boolean {
  return Object.values(params).every(
    (value) => typeof value === 'string' && value.length > 0
  )
}

/** Reads one section's route params with the same `.catch(() => [])`
 * discipline the routes' `generateStaticParams` use, so the sitemap lists
 * exactly the URLs the routes serve and a failed read drops only its section. */
const readParams = <TParams extends Record<string, string>>(
  query: string,
  fetchOrigin: string
) =>
  createAcademicStaticParams<TParams>(
    query,
    fetchOrigin,
    ACADEMIC_CATALOG_TAGS
  )().then((rows) => rows.filter(isComplete))

const toCatalogEntries = async (
  toUrl: (path: string) => string
): Promise<Array<SitemapEntry>> => {
  const [universities, faculties, studies, professors] = await Promise.all([
    readParams<UniversityRouteParams>(
      universityStaticParamsQuery,
      'sitemap-universities'
    ),
    readParams<FacultyRouteParams>(
      facultyStaticParamsQuery,
      'sitemap-faculties'
    ),
    // A study with a site has its own section, so only the ones still served
    // at their nested catalog URL are listed here.
    listStudies().then((studies) => studies.filter((study) => !study.siteSlug)),
    readParams<ProfessorRouteParams>(
      professorStaticParamsQuery,
      'sitemap-professors'
    ),
  ])

  return [
    { url: toUrl('/') },
    { url: toUrl('/search') },
    ...universities.map((params) => ({
      url: toUrl(getAcademicPath({ type: 'university', ...params })),
    })),
    ...faculties.map((params) => ({
      url: toUrl(getAcademicPath({ type: 'faculty', ...params })),
    })),
    ...studies.map((params) => ({
      url: toUrl(getAcademicPath({ type: 'study', ...params })),
    })),
    ...professors.map((params) => ({
      url: toUrl(getAcademicPath({ type: 'professor', ...params })),
    })),
  ]
}

const toStudyEntries = async (
  study: StudyRouteParams & { siteSlug: string },
  toUrl: (path: string) => string
): Promise<Array<SitemapEntry>> => {
  const subjects = await readParams<SubjectRouteParams>(
    subjectStaticParamsQuery,
    'sitemap-subjects'
  )
  const key = studyKey(study)

  return [
    { url: toUrl(getAcademicPath({ type: 'study', ...study })) },
    ...subjects
      .filter((params) => studyKey(params) === key)
      .map((params) => ({
        url: toUrl(getAcademicPath({ type: 'subject', ...params })),
      })),
  ]
}

const toScriptEntries = async (
  sectionIndex: number,
  toUrl: (path: string) => string
): Promise<Array<SitemapEntry>> => {
  const scripts = (await getScriptSitemapEntries()) ?? []
  const offset = sectionIndex * MAX_URLS_PER_SITEMAP

  return scripts.slice(offset, offset + MAX_URLS_PER_SITEMAP).map((script) => ({
    url: toUrl(
      getAcademicPath({
        type: 'script',
        scriptSlug: script.slug,
        siteSlug: script.study_site_slug,
      })
    ),
    lastModified: script.updated_at,
  }))
}

/**
 * The entries of one sitemap section (see `listSitemapSections`), built once at
 * build time: `app/sitemap/[section]/route.ts` prunes them, and
 * `app/sitemap.xml/route.ts` is the index over them. Splitting this way keeps
 * no single file near the protocol's URL limit and lets the catalog, each
 * study's subjects and the scripts rebuild independently.
 */
export const buildSitemapSection = async (
  id: string
): Promise<Array<SitemapEntry>> => {
  if (!hasSiteOrigin()) return []

  const toUrl = (path: string) => new URL(path, websiteDomain).toString()

  if (id === CATALOG_SECTION) {
    return toCatalogEntries(toUrl)
  }

  if (id.startsWith(STUDY_SECTION_PREFIX)) {
    const index = Number(id.slice(STUDY_SECTION_PREFIX.length))
    const studies = await listStudySites()
    const study = Number.isInteger(index) ? studies.at(index) : undefined

    return study ? toStudyEntries(study, toUrl) : []
  }

  if (id.startsWith(SCRIPT_SECTION_PREFIX)) {
    const index = Number(id.slice(SCRIPT_SECTION_PREFIX.length))

    return Number.isInteger(index) && index >= 0
      ? toScriptEntries(index, toUrl)
      : []
  }

  return []
}
