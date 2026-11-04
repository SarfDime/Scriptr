import { UI_STRINGS } from '@shared/config/strings'
import { FacultyOverviewCard } from '@/components/academics/faculty/FacultyOverviewCard'
import { ProfessorsSection } from '@/components/academics/professor/ProfessorsSection'
import { StudyExplorer } from '@/components/academics/study/StudyExplorer'
import { BackLink } from '@/components/common/BackLink'
import { PageLayout } from '@/components/layout/PageLayout'
import {
  createAcademicMetadata,
  createAcademicStaticParams,
  fetchAcademicDetailOrNotFound,
} from '@/lib/academic-detail-page'
import { getAcademicPath } from '@/lib/academic-routes'
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
 * Rendered at build time and never regenerated: the URL space is fixed by
 * `generateStaticParams`, and nothing here reads a request-time API. Pinned so a
 * later edit cannot quietly turn the route dynamic — remove these two lines if
 * the page ever needs `cookies()`/`headers()`/search params.
 */
export const dynamic = 'force-static'
export const revalidate = false

export const dynamicParams = false

export const generateStaticParams =
  createAcademicStaticParams<FacultyRouteParams>(
    facultyStaticParamsQuery,
    'faculties-static-params'
  )

export const generateMetadata = createAcademicMetadata<
  FacultyDetail,
  FacultyRouteParams
>({
  query: facultyDetailQuery,
  getPath: (p) => getAcademicPath({ type: 'faculty', ...p }),
  entityLabel: UI_STRINGS.academics.entity.faculty,
  fetchOriginPrefix: 'faculty',
  getOwnSlug: (p) => p.facultySlug,
  getDescription: (faculty) => faculty.description,
  descriptionFallback: (faculty) =>
    UI_STRINGS.academics.metadata.facultyDescription(faculty.name),
})

export default async function FacultyDetailPage({
  params,
}: AcademicDetailPageProps<FacultyRouteParams>) {
  const routeParams = await params

  const faculty = await fetchAcademicDetailOrNotFound<FacultyDetail>({
    query: facultyDetailQuery,
    params: routeParams,
    fetchOrigin: `faculty-detail-${routeParams.universitySlug}-${routeParams.facultySlug}`,
  })

  return (
    <PageLayout
      header={{
        greeting:
          faculty.university?.name ?? UI_STRINGS.academics.entity.faculty,
        title: faculty.name,
        actions: (
          <BackLink
            href={getAcademicPath({
              type: 'university',
              universitySlug: faculty.university.slug ?? faculty.university._id,
            })}
            label={faculty.university.name}
          />
        ),
      }}
      sidebar={<ProfessorsSection professors={faculty.professors} />}
    >
      <FacultyOverviewCard faculty={faculty} />
      <StudyExplorer
        studies={faculty.studies}
        title={UI_STRINGS.academics.studiesTitle}
        emptyMessage={UI_STRINGS.academics.noStudies}
      />
    </PageLayout>
  )
}
