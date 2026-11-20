import { UI_STRINGS_PACK } from '@shared/config/strings'
import { UniversityAdministrationCard } from '@/components/academics/university/UniversityAdministrationCard'
import { UniversityFacultyExplorer } from '@/components/academics/university/UniversityFacultyExplorer'
import { UniversityOverviewCard } from '@/components/academics/university/UniversityOverviewCard'
import { PageLayout } from '@/components/layout/PageLayout'
import {
  createAcademicStaticParams,
  fetchAcademicDetailOrNotFound,
} from '@/lib/academic-detail-page'
import { createAcademicMetadata } from '@/lib/academic-metadata'
import { getAcademicPath } from '@/lib/academic-routes'
import { ACADEMIC_PAGE_TAGS } from '@/lib/sanity-tags'
import { getServerStrings } from '@/lib/server-strings'
import {
  universityDetailQuery,
  universityStaticParamsQuery,
} from '@/sanity/queries/academics/university.queries'
import type {
  AcademicDetailPageProps,
  UniversityRouteParams,
} from '@/types/academics/academics.types'
import type { UniversityDetail } from '@/types/academics/university.types'

/**
 * Rendered at build time and never on a clock: the URL space is fixed by
 * `generateStaticParams` and nothing here reads a request-time API. The publish
 * webhook invalidates the page through its type tags; otherwise it is rebuilt
 * with the next deploy. `ensureStatic` pins that: a later edit that reads
 * request-time data fails the build instead of silently rendering per request.
 *
 * `instant` is off because the page is one entry of the URL and nothing else:
 * awaiting `params` before the first byte prerenders that entry whole and keeps
 * an unknown slug a real 404, which a boundary around the read would turn into
 * a streamed 200.
 */
export const ensureStatic = 'navigation'
export const instant = false

export const generateStaticParams =
  createAcademicStaticParams<UniversityRouteParams>(
    universityStaticParamsQuery,
    'universities-static-params',
    ACADEMIC_PAGE_TAGS.university
  )

export const generateMetadata = createAcademicMetadata<
  UniversityDetail,
  UniversityRouteParams
>({
  query: universityDetailQuery,
  getPath: (p, locale) =>
    getAcademicPath(
      { type: 'university', universitySlug: p.universitySlug },
      locale
    ),
  entityLabel: (strings) => strings.academics.entity.university,
  fetchOriginPrefix: 'university',
  tags: ACADEMIC_PAGE_TAGS.university,
  getOwnSlug: (p) => p.universitySlug,
  getDescription: (university) => university.description,
  descriptionFallback: (university, strings) =>
    strings.academics.metadata.universityDescription(university.name),
})

export default async function UniversityDetailPage({
  params,
}: AcademicDetailPageProps<UniversityRouteParams>) {
  const routeParams = await params
  const { locale } = routeParams
  const UI_STRINGS = await getServerStrings(UI_STRINGS_PACK, locale)
  const university = await fetchAcademicDetailOrNotFound<UniversityDetail>({
    query: universityDetailQuery,
    params: routeParams,
    fetchOrigin: `university-detail-${routeParams.universitySlug}`,
    tags: ACADEMIC_PAGE_TAGS.university,
  })

  return (
    <PageLayout
      header={{
        greeting: UI_STRINGS.academics.entity.university,
        title: university.name,
      }}
      sidebar={
        <UniversityAdministrationCard
          rector={university.rector}
          viceRectors={university.viceRectors}
        />
      }
    >
      <UniversityOverviewCard {...university} />
      <UniversityFacultyExplorer
        faculties={university.faculties ?? []}
        universitySlug={routeParams.universitySlug}
        title={UI_STRINGS.academics.faculties}
        emptyMessage={UI_STRINGS.academics.noFaculties}
      />
    </PageLayout>
  )
}
