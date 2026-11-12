import { UI_STRINGS } from '@shared/config/strings'
import { StudyDetailContent } from '@/components/academics/study/StudyDetailContent'
import {
  createAcademicMetadata,
  fetchAcademicDetailOrNotFound,
} from '@/lib/academic-detail-page'
import { getStudySiteUrl } from '@/lib/academic-routes'
import { getTopScripts } from '@/lib/api/scripts-api'
import { ACADEMIC_PAGE_TAGS } from '@/lib/sanity-tags'
import { toScriptSummaryDetails } from '@/lib/script-display'
import { getStudySite, getStudySiteOrNotFound } from '@/lib/study-site'
import { studyDetailQuery } from '@/sanity/queries/academics/study.queries'
import type { StudySiteRouteParams } from '@/types/academics/academics.types'
import type { StudyDetail } from '@/types/academics/study.types'

/** How many of the study's top scripts the sidebar lists. The full list is the
 * feed; this is a taste of it. */
const SIDEBAR_SCRIPT_LIMIT = 7

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
  getPath: ({ siteSlug }) => getStudySiteUrl(siteSlug),
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

  const [study, topScripts] = await Promise.all([
    fetchAcademicDetailOrNotFound<StudyDetail>({
      query: studyDetailQuery,
      params: {
        universitySlug: site.universitySlug,
        facultySlug: site.facultySlug,
        studySlug: site.studySlug,
      },
      fetchOrigin: `study-site-detail-${siteSlug}`,
      tags: ACADEMIC_PAGE_TAGS.study,
    }),
    // The sidebar's top scripts are a study-scoped, cache-tagged read: a script
    // mutation revalidates this page with the tag, so it needs no clock.
    site.dbId
      ? getTopScripts(SIDEBAR_SCRIPT_LIMIT, site.dbId)
      : Promise.resolve(null),
  ])

  return (
    <StudyDetailContent
      study={study}
      fallback={site}
      scripts={toScriptSummaryDetails(topScripts ?? [])}
      scriptsUnavailable={topScripts === null}
    />
  )
}
