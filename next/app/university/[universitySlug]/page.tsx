import { UI_STRINGS } from '@shared/config/strings'
import { UniversityAdministrationCard } from '@/components/academics/university/UniversityAdministrationCard'
import { UniversityContactCard } from '@/components/academics/university/UniversityContactCard'
import { UniversityFacultyExplorer } from '@/components/academics/university/UniversityFacultyExplorer'
import { UniversityOverviewCard } from '@/components/academics/university/UniversityOverviewCard'
import { PageLayout } from '@/components/layout/PageLayout'
import {
  createAcademicMetadata,
  createAcademicStaticParams,
  fetchAcademicDetailOrNotFound,
} from '@/lib/academic-detail-page'
import {
  universityDetailQuery,
  universityStaticParamsQuery,
} from '@/sanity/queries/academics/university.queries'
import type {
  AcademicDetailPageProps,
  UniversityRouteParams,
} from '@/types/academics/academics.types'
import type { UniversityDetail } from '@/types/academics/university.types'

export const dynamicParams = false

export const generateStaticParams =
  createAcademicStaticParams<UniversityRouteParams>(
    universityStaticParamsQuery,
    'universities-static-params'
  )

export const generateMetadata = createAcademicMetadata<
  UniversityDetail,
  UniversityRouteParams
>({
  query: universityDetailQuery,
  pageDomain: 'universities',
  entityLabel: 'University',
  fetchOriginPrefix: 'university',
  getOwnSlug: (p) => p.universitySlug,
  getDescription: (university) => university.description,
  descriptionFallback: (university) =>
    `Explore faculties, departments, and academic programs at ${university.name}.`,
})

export default async function UniversityDetailPage({
  params,
}: AcademicDetailPageProps<UniversityRouteParams>) {
  const routeParams = await params
  const university = await fetchAcademicDetailOrNotFound<UniversityDetail>({
    query: universityDetailQuery,
    params: routeParams,
    fetchOrigin: `university-detail-${routeParams.universitySlug}`,
  })

  return (
    <PageLayout
      header={{
        greeting: 'University',
        title: university.name,
      }}
      sidebar={
        <>
          <UniversityContactCard
            streetAddress={university.streetAddress}
            telephone={university.telephone}
            email={university.email}
            website={university.website}
          />
          <UniversityAdministrationCard
            rector={university.rector}
            viceRectors={university.viceRectors}
          />
        </>
      }
    >
      <UniversityOverviewCard {...university} />
      <UniversityFacultyExplorer
        faculties={university.faculties ?? []}
        universitySlug={routeParams.universitySlug}
        title='Faculties'
        emptyMessage={UI_STRINGS.academics.noFaculties}
      />
    </PageLayout>
  )
}
