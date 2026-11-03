import type { MetadataRoute } from 'next'
import { createAcademicStaticParams } from '@/lib/academic-detail-page'
import { getAcademicPath } from '@/lib/academic-routes'
import { getScriptSitemapEntries } from '@/lib/api/scripts-api'
import { nextLogs } from '@/lib/logger'
import { websiteDomain } from '@/sanity/env'
import { facultyStaticParamsQuery } from '@/sanity/queries/academics/faculty.queries'
import { professorStaticParamsQuery } from '@/sanity/queries/academics/professor.queries'
import { studyStaticParamsQuery } from '@/sanity/queries/academics/study.queries'
import { subjectStaticParamsQuery } from '@/sanity/queries/academics/subject.queries'
import { universityStaticParamsQuery } from '@/sanity/queries/academics/university.queries'
import type {
  FacultyRouteParams,
  ProfessorRouteParams,
  StudyRouteParams,
  SubjectRouteParams,
  UniversityRouteParams,
} from '@/types/academics/academics.types'

/**
 * Prerendered, then revalidated on Next's default 60-second window: the route
 * segment `revalidate` export has no effect on a metadata route here (checked
 * against the build manifest, which stays at 60 whatever it is set to), and
 * ISR only regenerates on the next request after that window lapses, so a
 * crawler still reads the cached copy.
 */

type SitemapEntry = MetadataRoute.Sitemap[number]

/** A static-params row with a missing parent slug would build a broken path. */
const isComplete = (params: Record<string, string>): boolean =>
  Object.values(params).every(
    (value) => typeof value === 'string' && value.length > 0
  )

/** Reads one section's route params with the same `.catch(() => [])`
 * discipline the routes' `generateStaticParams` use, so the sitemap lists
 * exactly the URLs the routes serve and a failed read drops only its section. */
const readParams = <TParams extends Record<string, string>>(
  query: string,
  fetchOrigin: string
) =>
  createAcademicStaticParams<TParams>(query, fetchOrigin)().then((rows) =>
    rows.filter(isComplete)
  )

const getAcademicEntries = async (
  toUrl: (path: string) => string
): Promise<Array<SitemapEntry>> => {
  const [universities, faculties, studies, subjects, professors] =
    await Promise.all([
      readParams<UniversityRouteParams>(
        universityStaticParamsQuery,
        'sitemap-universities'
      ),
      readParams<FacultyRouteParams>(
        facultyStaticParamsQuery,
        'sitemap-faculties'
      ),
      readParams<StudyRouteParams>(studyStaticParamsQuery, 'sitemap-studies'),
      readParams<SubjectRouteParams>(
        subjectStaticParamsQuery,
        'sitemap-subjects'
      ),
      readParams<ProfessorRouteParams>(
        professorStaticParamsQuery,
        'sitemap-professors'
      ),
    ])

  return [
    ...universities.map((params) => ({
      url: toUrl(getAcademicPath({ type: 'university', ...params })),
    })),
    ...faculties.map((params) => ({
      url: toUrl(getAcademicPath({ type: 'faculty', ...params })),
    })),
    ...studies.map((params) => ({
      url: toUrl(getAcademicPath({ type: 'study', ...params })),
    })),
    ...subjects.map((params) => ({
      url: toUrl(getAcademicPath({ type: 'subject', ...params })),
    })),
    ...professors.map((params) => ({
      url: toUrl(getAcademicPath({ type: 'professor', ...params })),
    })),
  ]
}

const getScriptEntries = async (
  toUrl: (path: string) => string
): Promise<Array<SitemapEntry>> => {
  const scripts = (await getScriptSitemapEntries()) ?? []

  return scripts.map((script) => ({
    url: toUrl(getAcademicPath({ type: 'script', scriptSlug: script.slug })),
    lastModified: script.updated_at,
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Without the site origin every URL would be relative, or built on the wrong
  // domain, so publish nothing rather than a sitemap crawlers must reject.
  if (!websiteDomain) {
    nextLogs({
      logLevel: 'warn',
      message:
        'NEXT_PUBLIC_SITE_URL is not set; /sitemap.xml is empty because its URLs need the site origin.',
    })
    return []
  }

  const toUrl = (path: string) => new URL(path, websiteDomain).toString()

  const [academicEntries, scriptEntries] = await Promise.all([
    getAcademicEntries(toUrl),
    getScriptEntries(toUrl),
  ])

  return [
    { url: toUrl('/') },
    { url: toUrl('/search') },
    ...academicEntries,
    ...scriptEntries,
  ]
}
