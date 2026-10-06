import { ProfessorsSection } from '@/components/academics/professor/ProfessorsSection'
import { StudyOverviewCard } from '@/components/academics/study/StudyOverviewCard'
import { SubjectsExplorer } from '@/components/academics/subject/SubjectsExplorer'
import { BackLink } from '@/components/common/BackLink'
import { PageLayout } from '@/components/layout/PageLayout'
import {
  createAcademicMetadata,
  createAcademicStaticParams,
  fetchAcademicDetailOrNotFound,
} from '@/lib/academic-detail-page'
import { getAcademicPath } from '@/lib/academic-routes'
import {
  studyDetailQuery,
  studyStaticParamsQuery,
} from '@/sanity/queries/academics/study.queries'
import type {
  AcademicDetailPageProps,
  StudyRouteParams,
} from '@/types/academics/academics.types'
import type { StudyDetail } from '@/types/academics/study.types'

export const dynamicParams = false

export const generateStaticParams =
  createAcademicStaticParams<StudyRouteParams>(
    studyStaticParamsQuery,
    'studies-static-params'
  )

export const generateMetadata = createAcademicMetadata<
  StudyDetail,
  StudyRouteParams
>({
  query: studyDetailQuery,
  pageDomain: 'studies',
  entityLabel: 'Study',
  fetchOriginPrefix: 'study',
  getOwnSlug: (p) => p.studySlug,
  getDescription: (study) => study.description,
  descriptionFallback: (study) =>
    `Explore academic subjects, faculty administration, and professors at ${study.name}.`,
})

export default async function StudyDetailPage({
  params,
}: AcademicDetailPageProps<StudyRouteParams>) {
  const routeParams = await params

  const study = await fetchAcademicDetailOrNotFound<StudyDetail>({
    query: studyDetailQuery,
    params: routeParams,
    fetchOrigin: `study-detail-${routeParams.universitySlug}-${routeParams.facultySlug}-${routeParams.studySlug}`,
  })

  return (
    <PageLayout
      header={{
        greeting: study.faculty?.name ?? 'Faculty',
        title: study.name,
        actions: (
          <>
            <BackLink
              href={getAcademicPath({
                type: 'faculty',
                universitySlug: study.faculty.university?.slug,
                facultySlug: study.faculty?.slug,
              })}
              label={study.faculty.name}
            />
            <BackLink
              href={getAcademicPath({
                type: 'university',
                universitySlug: study.faculty.university?.slug,
              })}
              label={study.faculty.university.name}
              backLevel='twoBack'
            />
          </>
        ),
      }}
      sidebar={<ProfessorsSection professors={study.professors} />}
    >
      <StudyOverviewCard study={study} />

      <SubjectsExplorer subjects={study.subjects ?? []} />
    </PageLayout>
  )
}
