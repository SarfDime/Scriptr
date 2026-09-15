import { ProfessorsSection } from '@/components/academics/professor/ProfessorsSection'
import { StudyOverviewCard } from '@/components/academics/study/StudyOverviewCard'
import { StudySubjectsExplorer } from '@/components/academics/study/StudySubjectsExplorer'
import { BackLink } from '@/components/common/BackLink'
import { Box } from '@/components/common/Box'
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
          <Box className='ui-cluster gap-2'>
            {study.faculty && (
              // NOTE: kept the pre-existing behavior of linking to the parent
              // university, labeled with the faculty's name. If you actually
              // want this to link to the faculty page instead, switch this to
              // `type: 'faculty'` with both universitySlug and facultySlug.
              <BackLink
                href={getAcademicPath({
                  type: 'university',
                  universitySlug:
                    study.faculty.university?.slug ??
                    study.faculty.university?._id ??
                    '',
                })}
                label={study.faculty.name}
                variant='red'
              />
            )}
            <BackLink
              href='/universities'
              label='← All Universities'
              variant='brand'
            />
          </Box>
        ),
      }}
      sidebar={<ProfessorsSection professors={study.professors} />}
    >
      <StudyOverviewCard study={study} />

      <StudySubjectsExplorer subjects={study.subjects ?? []} />
    </PageLayout>
  )
}
