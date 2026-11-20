import { UI_STRINGS_PACK } from '@shared/config/strings'
import { FacultyOverviewCard } from '@/components/academics/faculty/FacultyOverviewCard'
import { ProfessorsSection } from '@/components/academics/professor/ProfessorsSection'
import { StudyExplorer } from '@/components/academics/study/StudyExplorer'
import { BackLink } from '@/components/common/BackLink'
import { PageLayout } from '@/components/layout/PageLayout'
import {
  createAcademicStaticParams,
  fetchAcademicDetailOrNotFound,
} from '@/lib/academic-detail-page'
import { createAcademicMetadata } from '@/lib/academic-metadata'
import { getAcademicPath } from '@/lib/academic-routes'
import { ACADEMIC_PAGE_TAGS } from '@/lib/sanity-tags'
import { getServerStrings } from '@/lib/server-strings'
import {
  facultyDetailQuery,
  facultyStaticParamsQuery,
} from '@/sanity/queries/academics/faculty.queries'
import type {
  AcademicDetailPageProps,
  FacultyRouteParams,
} from '@/types/academics/academics.types'
import type { FacultyDetail } from '@/types/academics/faculty.types'

/**
 * Rendered at build time and never on a clock: the URL space is fixed by
 * `generateStaticParams` and nothing here reads a request-time API. The publish
 * webhook invalidates the page through its type tags; otherwise it is rebuilt
 * with the next deploy. `ensureStatic` pins that: a later edit that reads
 * request-time data fails the build instead of silently rendering per request.
 *
 * `instant` is off because the page is one entry of the URL and nothing else:
 * awaiting `params` before the first byte prerenders that entry whole and keeps
 * an unknown slug a real 404, which a boundary around the read would turn into
 * a streamed 200.
 */
export const ensureStatic = 'navigation'
export const instant = false

export const generateStaticParams =
  createAcademicStaticParams<FacultyRouteParams>(
    facultyStaticParamsQuery,
    'faculties-static-params',
    ACADEMIC_PAGE_TAGS.faculty
  )

export const generateMetadata = createAcademicMetadata<
  FacultyDetail,
  FacultyRouteParams
>({
  query: facultyDetailQuery,
  getPath: (p, locale) => getAcademicPath({ type: 'faculty', ...p }, locale),
  entityLabel: (strings) => strings.academics.entity.faculty,
  fetchOriginPrefix: 'faculty',
  tags: ACADEMIC_PAGE_TAGS.faculty,
  getOwnSlug: (p) => p.facultySlug,
  getDescription: (faculty) => faculty.description,
  descriptionFallback: (faculty, strings) =>
    strings.academics.metadata.facultyDescription(faculty.name),
})

export default async function FacultyDetailPage({
  params,
}: AcademicDetailPageProps<FacultyRouteParams>) {
  const routeParams = await params
  const { locale } = routeParams
  const UI_STRINGS = await getServerStrings(UI_STRINGS_PACK, locale)

  const faculty = await fetchAcademicDetailOrNotFound<FacultyDetail>({
    query: facultyDetailQuery,
    params: routeParams,
    fetchOrigin: `faculty-detail-${routeParams.universitySlug}-${routeParams.facultySlug}`,
    tags: ACADEMIC_PAGE_TAGS.faculty,
  })

  return (
    <PageLayout
      header={{
        greeting:
          faculty.university?.name ?? UI_STRINGS.academics.entity.faculty,
        title: faculty.name,
        actions: (
          <BackLink
            href={getAcademicPath(
              {
                type: 'university',
                universitySlug:
                  faculty.university.slug ?? faculty.university._id,
              },
              locale
            )}
            label={faculty.university.name}
          />
        ),
      }}
      sidebar={<ProfessorsSection professors={faculty.professors} />}
    >
      <FacultyOverviewCard faculty={faculty} />
      <StudyExplorer studies={faculty.studies} />
    </PageLayout>
  )
}
