import { StudyDetailContent } from '@/components/academics/study/StudyDetailContent'
import { fetchAcademicDetailOrNotFound } from '@/lib/academic-detail-page'
import { createAcademicMetadata } from '@/lib/academic-metadata'
import { getStudySiteUrl } from '@/lib/academic-routes'
import { getTopScripts } from '@/lib/api/scripts-api'
import { ACADEMIC_PAGE_TAGS } from '@/lib/sanity-tags'
import { toScriptSummaryDetails } from '@/lib/script-display'
import {
  getStudySite,
  getStudySiteOrNotFound,
  listStudySites,
} from '@/lib/study-site'
import { studyDetailQuery } from '@/sanity/queries/academics/study.queries'
import type { StudySiteRouteParams } from '@/types/academics/academics.types'
import type { StudyDetail } from '@/types/academics/study.types'
import type { LocalePageProps } from '@/types/localization.types'

/** How many of the study's top scripts the sidebar lists. The full list is the
 * feed; this is a taste of it. */
const SIDEBAR_SCRIPT_LIMIT = 7

/**
 * A study site's root: its academic overview — what it is, its subjects and its
 * professors. Every academic entity in the catalog is served at its overview, so
 * a study reads the same way as a university and a faculty; the scripts its
 * students share are the sub-page beside it (`…/scripts`).
 *
 * Built once per study that owns a site, and held until the publish webhook
 * invalidates it: editorial content, no clock. A study added between two deploys
 * is not in the list, so it renders on demand instead of 404ing.
 */
export const dynamic = 'force-static'
export const revalidate = false

export const generateStaticParams = async (): Promise<
  Array<StudySiteRouteParams>
> => (await listStudySites()).map((siteSlug) => ({ siteSlug }))

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
  getPath: ({ siteSlug }, locale) => getStudySiteUrl(siteSlug, locale),
  entityLabel: (strings) => strings.academics.entity.study,
  fetchOriginPrefix: 'study-site',
  tags: ACADEMIC_PAGE_TAGS.study,
  getOwnSlug: ({ siteSlug }) => siteSlug,
  getDescription: (study) => study.description,
  descriptionFallback: (study, strings) =>
    strings.academics.metadata.studyDescription(study.name),
})

export default async function StudySitePage({
  params,
}: LocalePageProps<StudySiteRouteParams>) {
  const { siteSlug, locale } = await params
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
      scripts={toScriptSummaryDetails(topScripts ?? [], locale)}
      scriptsUnavailable={topScripts === null}
    />
  )
}
