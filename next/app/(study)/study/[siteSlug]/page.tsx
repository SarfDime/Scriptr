import { UI_STRINGS } from '@shared/config/strings'
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
 * A study site's root: its academic overview — what it is, its subjects and its
 * professors. Every academic entity in the catalog is served at its overview, so
 * a study reads the same way as a university and a faculty; the scripts its
 * students share are the sub-page beside it (`…/scripts`).
 *
 * Prerendered on the first request and held until the publish webhook
 * invalidates it (`revalidate = false`): editorial content, no clock.
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

  return <StudyDetailContent study={study} fallback={site} />
}
