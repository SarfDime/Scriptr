import { StudyDetailContent } from '@/components/academics/study/StudyDetailContent'
import { fetchAcademicDetailOrNotFound } from '@/lib/academic-detail-page'
import { createAcademicMetadata } from '@/lib/academic-metadata'
import { getStudySiteUrl } from '@/lib/academic-routes'
import { ACADEMIC_PAGE_TAGS } from '@/lib/sanity-tags'
import {
  getStudySite,
  getStudySiteOrNotFound,
  listStudySites,
} from '@/lib/study-site'
import { studyDetailQuery } from '@/sanity/queries/academics/study.queries'
import type { StudySiteRouteParams } from '@/types/academics/academics.types'
import type { StudyDetail } from '@/types/academics/study.types'
import type { LocalePageProps } from '@/types/localization.types'

/**
 * A study site's root: its academic overview — what it is, its subjects and its
 * professors. Every academic entity in the catalog is served at its overview, so
 * a study reads the same way as a university and a faculty; the scripts its
 * students share are the sub-page beside it (`…/scripts`).
 *
 * Built once per study that owns a site, and held until the publish webhook
 * invalidates it: editorial content, no clock. A study added between two deploys
 * is not in the list, so it renders on demand instead of 404ing.
 *
 * `instant` is off because the page is one entry of the URL and nothing else:
 * awaiting `params` before the first byte prerenders that entry whole and keeps
 * an unknown slug a real 404, which a boundary around the read would turn into
 * a streamed 200.
 */
export const ensureStatic = 'navigation'
export const instant = false

export const generateStaticParams = async (): Promise<
  Array<StudySiteRouteParams>
> => (await listStudySites()).map((siteSlug) => ({ siteSlug }))

export const generateMetadata = createAcademicMetadata<
  StudyDetail,
  StudySiteRouteParams
>({
  query: studyDetailQuery,
  resolveQueryParams: async ({ siteSlug }, locale) => {
    const site = await getStudySite(siteSlug, locale)
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
