import { UI_STRINGS } from '@shared/config/strings'
import { permanentRedirect } from 'next/navigation'
import { StudyDetailContent } from '@/components/academics/study/StudyDetailContent'
import {
  createAcademicMetadata,
  fetchAcademicDetailOrNotFound,
} from '@/lib/academic-detail-page'
import { getAcademicPath, getStudyPath } from '@/lib/academic-routes'
import { ACADEMIC_PAGE_TAGS } from '@/lib/sanity-tags'
import { studyDetailQuery } from '@/sanity/queries/academics/study.queries'
import type {
  AcademicDetailPageProps,
  StudyRouteParams,
} from '@/types/academics/academics.types'
import type { StudyDetail } from '@/types/academics/study.types'

/**
 * The nested catalog URL of a study. It is a forwarding address now: a study
 * that has a site handle answers 308 at `/study/[siteSlug]`, which is the only
 * canonical URL it has.
 *
 * A study without a handle yet still renders here, so nothing breaks while the
 * handle is being authored. That is why this route stays dynamic instead of
 * prerendered: the answer depends on data that changes without a deploy.
 */
export const dynamic = 'force-dynamic'

export const generateMetadata = createAcademicMetadata<
  StudyDetail,
  StudyRouteParams
>({
  query: studyDetailQuery,
  getPath: (p) => getAcademicPath({ type: 'study', ...p }),
  entityLabel: UI_STRINGS.academics.entity.study,
  fetchOriginPrefix: 'study',
  tags: ACADEMIC_PAGE_TAGS.study,
  getOwnSlug: (p) => p.studySlug,
  getDescription: (study) => study.description,
  descriptionFallback: (study) =>
    UI_STRINGS.academics.metadata.studyDescription(study.name),
})

export default async function StudyDetailPage({
  params,
}: AcademicDetailPageProps<StudyRouteParams>) {
  const routeParams = await params

  const study = await fetchAcademicDetailOrNotFound<StudyDetail>({
    query: studyDetailQuery,
    params: routeParams,
    fetchOrigin: `study-detail-${routeParams.universitySlug}-${routeParams.facultySlug}-${routeParams.studySlug}`,
    tags: ACADEMIC_PAGE_TAGS.study,
  })

  if (study.siteSlug) permanentRedirect(getStudyPath(study.siteSlug))

  return (
    <StudyDetailContent
      study={study}
      fallback={routeParams}
      studyId={study.dbId}
    />
  )
}
