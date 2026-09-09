import { FacultyOverviewCard } from '@/components/academics/faculty/FacultyOverviewCard'
import { FacultySubjectsExplorer } from '@/components/academics/faculty/FacultySubjectsExplorer'
import { ProfessorsSection } from '@/components/academics/professor/ProfessorsSection'
import { Box } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
import { PageLayout } from '@/components/layout/PageLayout'
import {
  createAcademicMetadata,
  createAcademicStaticParams,
  fetchAcademicDetailOrNotFound,
} from '@/lib/academic-detail-page'
import { getUniversityPath } from '@/lib/academic-routes'
import {
  facultyDetailQuery,
  facultyStaticParamsQuery,
} from '@/sanity/queries/academics/faculty.queries'
import type { AcademicDetailPageProps } from '@/types/academics/academics.types'
import type { FacultyDetail } from '@/types/academics/faculty.types'

export const dynamicParams = false

export const generateStaticParams = createAcademicStaticParams(
  facultyStaticParamsQuery,
  'faculties-static-params'
)

export const generateMetadata = createAcademicMetadata<FacultyDetail>({
  query: facultyDetailQuery,
  pageDomain: 'faculties',
  entityLabel: 'Faculty',
  fetchOriginPrefix: 'faculty',
  getDescription: (faculty) => faculty.description,
  descriptionFallback: (faculty) =>
    `Explore academic subjects, faculty administration, and professors at ${faculty.name}.`,
})

export default async function FacultyDetailPage({
  params,
}: AcademicDetailPageProps) {
  const { slug } = await params

  const faculty = await fetchAcademicDetailOrNotFound<FacultyDetail>({
    query: facultyDetailQuery,
    slug,
    fetchOrigin: `faculty-detail-${slug}`,
  })

  return (
    <PageLayout
      header={{
        greeting: faculty.university?.name ?? 'Faculty',
        title: faculty.name,
        actions: (
          <Box className='ui-cluster gap-2'>
            {faculty.university && (
              <NextLink
                href={getUniversityPath(faculty.university._id)}
                className='ui-badge cp-red interactive'
              >
                {faculty.university.name}
              </NextLink>
            )}
            <NextLink
              href='/universities'
              className='ui-badge cp-brand interactive'
            >
              ← All Universities
            </NextLink>
          </Box>
        ),
      }}
      sidebar={<ProfessorsSection professors={faculty.professors} />}
    >
      <FacultyOverviewCard faculty={faculty} />

      <FacultySubjectsExplorer subjects={faculty.subjects ?? []} />
    </PageLayout>
  )
}
