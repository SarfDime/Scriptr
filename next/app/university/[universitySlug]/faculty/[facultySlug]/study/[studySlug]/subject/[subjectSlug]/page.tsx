import { UI_STRINGS } from '@shared/config/strings'
import { ScriptsSection } from '@/components/academics/scripts/ScriptSection'
import { SubjectHighlightsCard } from '@/components/academics/subject/SubjectHighlightsCard'
import { SubjectOverviewCard } from '@/components/academics/subject/SubjectOverviewCard'
import { BackLink } from '@/components/common/BackLink'
import { Box } from '@/components/common/Box'
import { PageLayout } from '@/components/layout/PageLayout'
import { RatingsSection } from '@/components/ratings/RatingsSection'
import {
  createAcademicMetadata,
  createAcademicStaticParams,
  fetchAcademicDetailOrNotFound,
} from '@/lib/academic-detail-page'
import { getAcademicPath } from '@/lib/academic-routes'
import { getScriptsBySubject } from '@/lib/api/scripts-api'
import { toScriptSummaryDetails } from '@/lib/script-display'
import {
  subjectDetailQuery,
  subjectStaticParamsQuery,
} from '@/sanity/queries/academics/subject.queries'
import type {
  AcademicDetailPageProps,
  SubjectRouteParams,
} from '@/types/academics/academics.types'
import type { SubjectDetail } from '@/types/academics/subject.types'

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
  createAcademicStaticParams<SubjectRouteParams>(
    subjectStaticParamsQuery,
    'subjects-static-params'
  )

export const generateMetadata = createAcademicMetadata<
  SubjectDetail,
  SubjectRouteParams
>({
  query: subjectDetailQuery,
  getPath: (p) => getAcademicPath({ type: 'subject', ...p }),
  entityLabel: UI_STRINGS.academics.entity.subject,
  fetchOriginPrefix: 'subject',
  getOwnSlug: (p) => p.subjectSlug,
  getDescription: (subject) => subject.description,
  descriptionFallback: (subject) =>
    UI_STRINGS.academics.metadata.subjectDescription(subject.name),
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
  const subjectScripts = subject.dbId
    ? await getScriptsBySubject(subject.dbId)
    : []
  const scripts = toScriptSummaryDetails(subjectScripts ?? [])

  return (
    <PageLayout
      header={{
        greeting: study?.name ?? UI_STRINGS.academics.entity.subject,
        title: subject.name,
        actions: study?.faculty && (
          <>
            <BackLink
              href={getAcademicPath({
                type: 'study',
                universitySlug:
                  study.faculty.university?.slug ?? routeParams.universitySlug,
                facultySlug: study.faculty.slug ?? routeParams.facultySlug,
                studySlug: study.slug ?? routeParams.studySlug,
              })}
              label={study.name}
            />
            <BackLink
              href={getAcademicPath({
                type: 'faculty',
                universitySlug:
                  study.faculty.university?.slug ?? routeParams.universitySlug,
                facultySlug: study.faculty.slug ?? routeParams.facultySlug,
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
        <SubjectHighlightsCard {...subject}>
          {subject.dbId ? (
            <RatingsSection
              key={`ratings-${subject.dbId}`}
              targetType='subject'
              targetId={subject.dbId}
            />
          ) : null}
        </SubjectHighlightsCard>
      </Box>

      <ScriptsSection
        scripts={scripts}
        scriptsUnavailable={subjectScripts === null}
        parentSubject={subject}
      />
    </PageLayout>
  )
}
