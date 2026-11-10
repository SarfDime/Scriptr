import { UI_STRINGS } from '@shared/config/strings'
import { ProfessorsSection } from '@/components/academics/professor/ProfessorsSection'
import { StudyOverviewCard } from '@/components/academics/study/StudyOverviewCard'
import { SubjectsExplorer } from '@/components/academics/subject/SubjectsExplorer'
import { BackLink } from '@/components/common/BackLink'
import { PageLayout } from '@/components/layout/PageLayout'
import {
  createAcademicMetadata,
  createAcademicStaticParams,
  fetchAcademicDetailOrNotFound,
} from '@/lib/academic-detail-page'
import { getAcademicPath } from '@/lib/academic-routes'
import { ACADEMIC_PAGE_TAGS } from '@/lib/sanity-tags'
import {
  studyDetailQuery,
  studyStaticParamsQuery,
} from '@/sanity/queries/academics/study.queries'
import type {
  AcademicDetailPageProps,
  StudyRouteParams,
} from '@/types/academics/academics.types'
import type { StudyDetail } from '@/types/academics/study.types'

/**
 * Rendered at build time and never on a clock: the URL space is fixed by
 * `generateStaticParams` and nothing here reads a request-time API. The publish
 * webhook invalidates the page through its type tags; otherwise it is rebuilt
 * with the next deploy. Pinned so a later edit cannot quietly turn the route
 * dynamic.
 */
export const dynamic = 'force-static'
export const revalidate = false

export const dynamicParams = false

export const generateStaticParams =
  createAcademicStaticParams<StudyRouteParams>(
    studyStaticParamsQuery,
    'studies-static-params',
    ACADEMIC_PAGE_TAGS.study
  )

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

  return (
    <PageLayout
      header={{
        greeting: study.faculty?.name ?? UI_STRINGS.academics.entity.faculty,
        title: study.name,
        actions: (
          <>
            <BackLink
              href={getAcademicPath({
                type: 'faculty',
                universitySlug:
                  study.faculty.university?.slug ?? routeParams.universitySlug,
                facultySlug: study.faculty?.slug ?? routeParams.facultySlug,
              })}
              label={study.faculty.name}
            />
            <BackLink
              href={getAcademicPath({
                type: 'university',
                universitySlug:
                  study.faculty.university?.slug ?? routeParams.universitySlug,
              })}
              label={study.faculty.university.name}
              backLevel='twoBack'
            />
          </>
        ),
      }}
      sidebar={<ProfessorsSection professors={study.professors} />}
    >
      <StudyOverviewCard study={study} />

      <SubjectsExplorer subjects={study.subjects ?? []} />
    </PageLayout>
  )
}
