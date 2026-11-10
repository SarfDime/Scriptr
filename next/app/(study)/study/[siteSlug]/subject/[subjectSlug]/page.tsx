import { UI_STRINGS } from '@shared/config/strings'
import { SubjectDetailContent } from '@/components/academics/subject/SubjectDetailContent'
import {
  createAcademicMetadata,
  fetchAcademicDetailOrNotFound,
} from '@/lib/academic-detail-page'
import { getStudyPath } from '@/lib/academic-routes'
import { ACADEMIC_PAGE_TAGS } from '@/lib/sanity-tags'
import { getStudySite, getStudySiteOrNotFound } from '@/lib/study-site'
import { subjectDetailQuery } from '@/sanity/queries/academics/subject.queries'
import type { SubjectSiteRouteParams } from '@/types/academics/academics.types'
import type { SubjectDetail } from '@/types/academics/subject.types'

/**
 * A subject inside one study's site. Same caching contract as the study home:
 * rendered on demand, held until the publish webhook invalidates it.
 */
export const revalidate = false

export const generateMetadata = createAcademicMetadata<
  SubjectDetail,
  SubjectSiteRouteParams
>({
  query: subjectDetailQuery,
  resolveQueryParams: async ({ siteSlug, subjectSlug }) => {
    const site = await getStudySite(siteSlug)
    if (!site) return null
    return {
      universitySlug: site.universitySlug,
      facultySlug: site.facultySlug,
      studySlug: site.studySlug,
      subjectSlug,
    }
  },
  getPath: ({ siteSlug, subjectSlug }) =>
    `${getStudyPath(siteSlug)}/subject/${subjectSlug}`,
  entityLabel: UI_STRINGS.academics.entity.subject,
  fetchOriginPrefix: 'subject-site',
  tags: ACADEMIC_PAGE_TAGS.subject,
  getOwnSlug: ({ subjectSlug }) => subjectSlug,
  getDescription: (subject) => subject.description,
  descriptionFallback: (subject) =>
    UI_STRINGS.academics.metadata.subjectDescription(subject.name),
})

export default async function SubjectSitePage({
  params,
}: {
  params: Promise<SubjectSiteRouteParams>
}) {
  const { siteSlug, subjectSlug } = await params
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
      studyPath={getStudyPath(siteSlug)}
      fallback={site}
    />
  )
}
