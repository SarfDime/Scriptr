import { ScriptsSection } from '@/components/academics/scripts/ScriptSection'
import { SubjectHighlightsCard } from '@/components/academics/subject/SubjectHighlightsCard'
import { SubjectOverviewCard } from '@/components/academics/subject/SubjectOverviewCard'
import { BackLink } from '@/components/common/BackLink'
import { Box } from '@/components/common/Box'
import { PageLayout } from '@/components/layout/PageLayout'
import {
  createAcademicMetadata,
  createAcademicStaticParams,
  fetchAcademicDetailOrNotFound,
} from '@/lib/academic-detail-page'
import { getAcademicPath } from '@/lib/academic-routes'
import { FAKE_SCRIPTS } from '@/lib/fake-scripts-data'
import {
  subjectDetailQuery,
  subjectStaticParamsQuery,
} from '@/sanity/queries/academics/subject.queries'
import type {
  AcademicDetailPageProps,
  SubjectRouteParams,
} from '@/types/academics/academics.types'
import type { SubjectDetail } from '@/types/academics/subject.types'

export const dynamicParams = false

export const generateStaticParams =
  createAcademicStaticParams<SubjectRouteParams>(
    subjectStaticParamsQuery,
    'subjects-static-params'
  )

export const generateMetadata = createAcademicMetadata<
  SubjectDetail,
  SubjectRouteParams
>({
  query: subjectDetailQuery,
  pageDomain: 'subjects',
  entityLabel: 'Subject',
  fetchOriginPrefix: 'subject',
  getOwnSlug: (p) => p.subjectSlug,
  getDescription: (subject) => subject.description,
  descriptionFallback: (subject) =>
    `Syllabus, academic year, exam sessions, and course details for ${subject.name}.`,
})

export default async function SubjectDetailPage({
  params,
}: AcademicDetailPageProps<SubjectRouteParams>) {
  const routeParams = await params

  const subject = await fetchAcademicDetailOrNotFound<SubjectDetail>({
    query: subjectDetailQuery,
    params: routeParams,
    fetchOrigin: `subject-detail-${routeParams.universitySlug}-${routeParams.facultySlug}-${routeParams.studySlug}-${routeParams.subjectSlug}`,
  })

  const study = subject.study

  return (
    <PageLayout
      header={{
        greeting: study?.name ?? 'Subject',
        title: subject.name,
        subtitle: subject.dbId ? `Database ID: ${subject.dbId}` : undefined, //TODO: Subtitle should be short bio or something similar not dbID all across the project
        actions: study?.faculty && (
          <>
            <BackLink
              href={getAcademicPath({
                type: 'study',
                universitySlug: study.faculty.university?.slug,
                facultySlug: study.faculty.slug,
                studySlug: study.slug,
              })}
              label={study.name}
            />
            <BackLink
              href={getAcademicPath({
                type: 'faculty',
                universitySlug: study.faculty.university?.slug,
                facultySlug: study.faculty.slug,
              })}
              label={study.faculty.name}
              backLevel='twoBack'
            />
          </>
        ),
      }}
    >
      {/* Hero: overview + highlights */}
      <Box className='grid gap-4 lg:grid-cols-[1.35fr_0.65fr]'>
        <SubjectOverviewCard {...subject} />
        <SubjectHighlightsCard {...subject} />
      </Box>

      <ScriptsSection scripts={FAKE_SCRIPTS} parentSubject={subject} />
    </PageLayout>
  )
}
