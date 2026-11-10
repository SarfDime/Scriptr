import { UI_STRINGS } from '@shared/config/strings'
import { permanentRedirect } from 'next/navigation'
import { SubjectDetailContent } from '@/components/academics/subject/SubjectDetailContent'
import {
  createAcademicMetadata,
  fetchAcademicDetailOrNotFound,
} from '@/lib/academic-detail-page'
import { getAcademicPath, getStudyPath } from '@/lib/academic-routes'
import { ACADEMIC_PAGE_TAGS } from '@/lib/sanity-tags'
import { subjectDetailQuery } from '@/sanity/queries/academics/subject.queries'
import type {
  AcademicDetailPageProps,
  SubjectRouteParams,
} from '@/types/academics/academics.types'
import type { SubjectDetail } from '@/types/academics/subject.types'

/**
 * The nested catalog URL of a subject. A subject belongs to a study, so once
 * that study has a site handle this answers 308 at
 * `/study/[siteSlug]/subject/[subjectSlug]`; a study without one still renders
 * here. Same reasoning as the study route: dynamic, because the answer changes
 * with data rather than a deploy.
 */
export const dynamic = 'force-dynamic'

export const generateMetadata = createAcademicMetadata<
  SubjectDetail,
  SubjectRouteParams
>({
  query: subjectDetailQuery,
  getPath: (p) => getAcademicPath({ type: 'subject', ...p }),
  entityLabel: UI_STRINGS.academics.entity.subject,
  fetchOriginPrefix: 'subject',
  tags: ACADEMIC_PAGE_TAGS.subject,
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
    tags: ACADEMIC_PAGE_TAGS.subject,
  })

  const siteSlug = subject.study?.siteSlug
  if (siteSlug) {
    const subjectSlug = subject.slug ?? routeParams.subjectSlug
    permanentRedirect(`${getStudyPath(siteSlug)}/subject/${subjectSlug}`)
  }

  return (
    <SubjectDetailContent
      subject={subject}
      studyPath={getAcademicPath({
        type: 'study',
        universitySlug: routeParams.universitySlug,
        facultySlug: routeParams.facultySlug,
        studySlug: routeParams.studySlug,
      })}
      fallback={routeParams}
    />
  )
}
