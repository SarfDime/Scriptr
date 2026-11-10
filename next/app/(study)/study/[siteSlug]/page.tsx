import { UI_STRINGS } from '@shared/config/strings'
import { StudySetupGate } from '@/components/academics/setup/StudySetupGate'
import { StudyDetailContent } from '@/components/academics/study/StudyDetailContent'
import {
  createAcademicMetadata,
  fetchAcademicDetailOrNotFound,
} from '@/lib/academic-detail-page'
import { getStudyPath } from '@/lib/academic-routes'
import { ACADEMIC_PAGE_TAGS } from '@/lib/sanity-tags'
import { getStudySite, getStudySiteOrNotFound } from '@/lib/study-site'
import { studyDetailQuery } from '@/sanity/queries/academics/study.queries'
import type { StudySiteRouteParams } from '@/types/academics/academics.types'
import type { StudyDetail } from '@/types/academics/study.types'

/**
 * A study's home. Prerendered on the first request and then held until the
 * publish webhook invalidates it — there is no clock (`revalidate = false`), and
 * the page count grows with the catalog rather than with user activity, so it is
 * not part of the build either.
 */
export const revalidate = false

export const generateMetadata = createAcademicMetadata<
  StudyDetail,
  StudySiteRouteParams
>({
  query: studyDetailQuery,
  resolveQueryParams: async ({ siteSlug }) => {
    const site = await getStudySite(siteSlug)
    if (!site) return null
    return {
      universitySlug: site.universitySlug,
      facultySlug: site.facultySlug,
      studySlug: site.studySlug,
    }
  },
  getPath: ({ siteSlug }) => getStudyPath(siteSlug),
  entityLabel: UI_STRINGS.academics.entity.study,
  fetchOriginPrefix: 'study-site',
  tags: ACADEMIC_PAGE_TAGS.study,
  getOwnSlug: ({ siteSlug }) => siteSlug,
  getDescription: (study) => study.description,
  descriptionFallback: (study) =>
    UI_STRINGS.academics.metadata.studyDescription(study.name),
})

export default async function StudySitePage({
  params,
}: {
  params: Promise<StudySiteRouteParams>
}) {
  const { siteSlug } = await params
  const site = await getStudySiteOrNotFound(siteSlug)

  const study = await fetchAcademicDetailOrNotFound<StudyDetail>({
    query: studyDetailQuery,
    params: {
      universitySlug: site.universitySlug,
      facultySlug: site.facultySlug,
      studySlug: site.studySlug,
    },
    fetchOrigin: `study-site-detail-${siteSlug}`,
    tags: ACADEMIC_PAGE_TAGS.study,
  })

  return (
    <>
      {site.dbId && <StudySetupGate siteSlug={siteSlug} studyId={site.dbId} />}
      <StudyDetailContent study={study} fallback={site} studyId={site.dbId} />
    </>
  )
}
