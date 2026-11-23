import { SubjectDetailContent } from '@/components/academics/subject/SubjectDetailContent'
import {
  createAcademicStaticParams,
  fetchAcademicDetailOrNotFound,
} from '@/lib/academic-detail-page'
import { createAcademicMetadata } from '@/lib/academic-metadata'
import { getStudySiteUrl } from '@/lib/academic-routes'
import { ACADEMIC_PAGE_TAGS } from '@/lib/sanity-tags'
import { getStudySite, getStudySiteOrNotFound } from '@/lib/study-site'
import {
  subjectDetailQuery,
  subjectStaticParamsQuery,
} from '@/sanity/queries/academics/subject.queries'
import type {
  SubjectRouteParams,
  SubjectSiteRouteParams,
} from '@/types/academics/academics.types'
import type { SubjectDetail } from '@/types/academics/subject.types'
import type { LocalePageProps } from '@/types/localization.types'

/**
 * A subject inside one study's site. Same caching contract as the study
 * overview: built once per subject that belongs to a study with a site handle,
 * and held until the publish webhook invalidates it.
 *
 * `instant` is off because the page is one entry of the URL and nothing else:
 * awaiting `params` before the first byte prerenders that entry whole and keeps
 * an unknown slug a real 404, which a boundary around the read would turn into
 * a streamed 200.
 */
export const ensureStatic = 'navigation'
export const instant = false

/**
 * A subject whose study has no site handle belongs to no site, so it is only
 * reachable in the catalog — it is left out rather than prerendered under a
 * placeholder handle.
 */
export const generateStaticParams = async (): Promise<
  Array<SubjectSiteRouteParams>
> => {
  const subjects = await createAcademicStaticParams<SubjectRouteParams>(
    subjectStaticParamsQuery,
    'subject-site-static-params',
    ACADEMIC_PAGE_TAGS.subject
  )()

  return subjects.flatMap(({ siteSlug, subjectSlug }) =>
    siteSlug ? [{ siteSlug, subjectSlug }] : []
  )
}

export const generateMetadata = createAcademicMetadata<
  SubjectDetail,
  SubjectSiteRouteParams
>({
  query: subjectDetailQuery,
  resolveQueryParams: async ({ siteSlug, subjectSlug }, locale) => {
    const site = await getStudySite(siteSlug, locale)
    if (!site) return null
    return {
      universitySlug: site.universitySlug,
      facultySlug: site.facultySlug,
      studySlug: site.studySlug,
      subjectSlug,
    }
  },
  getPath: ({ siteSlug, subjectSlug }, locale) =>
    `${getStudySiteUrl(siteSlug, locale)}/subject/${subjectSlug}`,
  entityLabel: (strings) => strings.academics.entity.subject,
  fetchOriginPrefix: 'subject-site',
  tags: ACADEMIC_PAGE_TAGS.subject,
  getOwnSlug: ({ subjectSlug }) => subjectSlug,
  getDescription: (subject) => subject.description,
  descriptionFallback: (subject, strings) =>
    strings.academics.metadata.subjectDescription(subject.name),
})

export default async function SubjectSitePage({
  params,
}: LocalePageProps<SubjectSiteRouteParams>) {
  const { siteSlug, subjectSlug, locale } = await params
  const site = await getStudySiteOrNotFound(siteSlug)

  const subject = await fetchAcademicDetailOrNotFound<SubjectDetail>({
    query: subjectDetailQuery,
    params: {
      universitySlug: site.universitySlug,
      facultySlug: site.facultySlug,
      studySlug: site.studySlug,
      subjectSlug,
    },
    fetchOrigin: `subject-site-detail-${siteSlug}-${subjectSlug}`,
    tags: ACADEMIC_PAGE_TAGS.subject,
  })

  return (
    <SubjectDetailContent
      subject={subject}
      studyPath={getStudySiteUrl(siteSlug, locale)}
      studyId={site.dbId}
      fallback={site}
    />
  )
}
