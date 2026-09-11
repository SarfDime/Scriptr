import { ProfessorsSection } from '@/components/academics/professor/ProfessorsSection'
import { StudyOverviewCard } from '@/components/academics/study/StudyOverviewCard'
import { StudySubjectsExplorer } from '@/components/academics/study/StudySubjectsExplorer'
import { Box } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
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
import type { AcademicDetailPageProps } from '@/types/academics/academics.types'
import type { StudyDetail } from '@/types/academics/study.types'

export const dynamicParams = false

export const generateStaticParams = createAcademicStaticParams(
  studyStaticParamsQuery,
  'studies-static-params'
)

export const generateMetadata = createAcademicMetadata<StudyDetail>({
  query: studyDetailQuery,
  pageDomain: 'studies',
  entityLabel: 'Study',
  fetchOriginPrefix: 'study',
  getDescription: (study) => study.description,
  descriptionFallback: (study) =>
    `Explore academic subjects, faculty administration, and professors at ${study.name}.`,
})

export default async function StudyDetailPage({
  params,
}: AcademicDetailPageProps) {
  const { slug } = await params

  const study = await fetchAcademicDetailOrNotFound<StudyDetail>({
    query: studyDetailQuery,
    slug,
    fetchOrigin: `study-detail-${slug}`,
  })

  return (
    <PageLayout
      header={{
        greeting: study.faculty?.name ?? 'Faculty',
        title: study.name,
        actions: (
          <Box className='ui-cluster gap-2'>
            {study.faculty && (
              <NextLink
                href={getAcademicPath({
                  type: 'university',
                  id: study.faculty.slug ?? study.faculty._id,
                })}
                className='ui-badge cp-red-interactive'
              >
                {study.faculty.name}
              </NextLink>
            )}
            <NextLink
              href='/universities'
              className='ui-badge cp-brand-interactive'
            >
              ← All Universities
            </NextLink>
          </Box>
        ),
      }}
      sidebar={<ProfessorsSection professors={study.professors} />}
    >
      <StudyOverviewCard study={study} />

      {/* TODO: Change to StudySubjectsExplorer once it is implemented */}
      <StudySubjectsExplorer subjects={study.subjects ?? []} />
    </PageLayout>
  )
}
