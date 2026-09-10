import { ScriptsSection } from '@/components/academics/scripts/ScriptSection'
import { SubjectHighlightsCard } from '@/components/academics/subject/SubjectHighlightsCard'
import { SubjectOverviewCard } from '@/components/academics/subject/SubjectOverviewCard'
import { Box } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card } from '@/components/ui/Card'
import {
  createAcademicMetadata,
  createAcademicStaticParams,
  fetchAcademicDetailOrNotFound,
} from '@/lib/academic-detail-page'
import { getFacultyPath } from '@/lib/academic-routes'
import { FAKE_SCRIPTS } from '@/lib/fake-scripts-data'
import {
  subjectDetailQuery,
  subjectStaticParamsQuery,
} from '@/sanity/queries/academics/subject.queries'
import type { AcademicDetailPageProps } from '@/types/academics/academics.types'
import type { SubjectDetail } from '@/types/academics/subject.types'

export const dynamicParams = false

export const generateStaticParams = createAcademicStaticParams(
  subjectStaticParamsQuery,
  'subjects-static-params'
)

export const generateMetadata = createAcademicMetadata<SubjectDetail>({
  query: subjectDetailQuery,
  pageDomain: 'subjects',
  entityLabel: 'Subject',
  fetchOriginPrefix: 'subject',
  getDescription: (subject) => subject.description,
  descriptionFallback: (subject) =>
    `Syllabus, academic year, exam sessions, and course details for ${subject.name}.`,
})

export default async function SubjectDetailPage({
  params,
}: AcademicDetailPageProps) {
  const { slug } = await params

  const subject = await fetchAcademicDetailOrNotFound<SubjectDetail>({
    query: subjectDetailQuery,
    slug,
    fetchOrigin: `subject-detail-${slug}`,
  })

  const faculty = subject.faculty

  return (
    <PageLayout
      header={{
        greeting: faculty?.name ?? 'Subject',
        title: subject.name,
        subtitle: subject.dbId ? `Database ID: ${subject.dbId}` : undefined, //TODO: Subtitle should be short bio or something similar not dbID all across the project
        actions: faculty && (
          // TODO: Factor out to reusable breadcrumb component
          <NextLink
            href={getFacultyPath(faculty._id)}
            className='ui-badge cp-brand-interactive'
          >
            ← {faculty.name}
          </NextLink>
        ),
      }}
    >
      {/* Hero: overview + highlights */}
      <Box className='grid gap-4 lg:grid-cols-[1.35fr_0.65fr]'>
        <SubjectOverviewCard {...subject} />
        <SubjectHighlightsCard {...subject} />
      </Box>

      {/* Subject Scripts */}
      <Card className='p-6'>
        <ScriptsSection scripts={FAKE_SCRIPTS} />
      </Card>
    </PageLayout>
  )
}
