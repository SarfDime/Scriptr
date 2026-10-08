import { FacultyOverviewCard } from '@/components/academics/faculty/FacultyOverviewCard'
import { FacultyStudyExplorer } from '@/components/academics/faculty/FacultyStudyExplorer'
import { ProfessorsSection } from '@/components/academics/professor/ProfessorsSection'
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
  pageDomain: 'faculties',
  entityLabel: 'Faculty',
  fetchOriginPrefix: 'faculty',
  getOwnSlug: (p) => p.facultySlug,
  getDescription: (faculty) => faculty.description,
  descriptionFallback: (faculty) =>
    `Explore academic subjects, faculty administration, and professors at ${faculty.name}.`,
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
        greeting: faculty.university?.name ?? 'Faculty',
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

      <FacultyStudyExplorer studies={faculty.studies} />
    </PageLayout>
  )
}
