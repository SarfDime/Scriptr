import { createAcademicStaticParams } from '@/lib/academic-detail-page'
import { getAcademicPath } from '@/lib/academic-routes'
import { ACADEMIC_CATALOG_TAGS } from '@/lib/sanity-tags'
import { CATALOG_SECTION, hasSiteOrigin } from '@/lib/sitemap-sections'
import type { SitemapEntry } from '@/lib/sitemap-xml'
import { websiteDomain } from '@/sanity/env'
import { facultyStaticParamsQuery } from '@/sanity/queries/academics/faculty.queries'
import { professorStaticParamsQuery } from '@/sanity/queries/academics/professor.queries'
import { universityStaticParamsQuery } from '@/sanity/queries/academics/university.queries'
import type {
  FacultyRouteParams,
  ProfessorRouteParams,
  UniversityRouteParams,
} from '@/types/academics/academics.types'

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
  // Every study is a site of its own with its own sitemap, so the catalog lists
  // only the levels above it — a study URL here would publish a second address
  // for a page that already has a canonical host.
  const [universities, faculties, professors] = await Promise.all([
    readParams<UniversityRouteParams>(
      universityStaticParamsQuery,
      'sitemap-universities'
    ),
    readParams<FacultyRouteParams>(
      facultyStaticParamsQuery,
      'sitemap-faculties'
    ),
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
    ...professors.map((params) => ({
      url: toUrl(getAcademicPath({ type: 'professor', ...params })),
    })),
  ]
}

/**
 * The entries of one catalog sitemap section, built once at build time:
 * `app/sitemap/[section]/route.ts` prunes them, and `app/sitemap.xml/route.ts`
 * is the index over them.
 *
 * A study's own pages are published by that study's host instead — see
 * `lib/study-sitemap.ts`.
 */
export const buildSitemapSection = async (
  id: string
): Promise<Array<SitemapEntry>> => {
  if (!hasSiteOrigin() || id !== CATALOG_SECTION) return []

  return toCatalogEntries((path) => new URL(path, websiteDomain).toString())
}
