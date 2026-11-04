import { UI_STRINGS } from '@shared/config/strings'
import { ProfessorAffiliationsCard } from '@/components/academics/professor/ProfessorAffiliationsCard'
import { ProfessorBiographyCard } from '@/components/academics/professor/ProfessorBiographyCard'
import { ProfessorComments } from '@/components/academics/professor/ProfessorComments'
import { ProfessorContactCard } from '@/components/academics/professor/ProfessorContactCard'
import { SubjectsExplorer } from '@/components/academics/subject/SubjectsExplorer'
import { BackLink } from '@/components/common/BackLink'
import { PageLayout } from '@/components/layout/PageLayout'
import { RatingsSection } from '@/components/ratings/RatingsSection'
import { Divider } from '@/components/ui/Divider'
import {
  createAcademicMetadata,
  createAcademicStaticParams,
  fetchAcademicDetailOrNotFound,
} from '@/lib/academic-detail-page'
import { getAcademicPath } from '@/lib/academic-routes'
import {
  professorDetailQuery,
  professorStaticParamsQuery,
} from '@/sanity/queries/academics/professor.queries'
import type {
  AcademicDetailPageProps,
  ProfessorRouteParams,
} from '@/types/academics/academics.types'
import type { ProfessorDetail } from '@/types/academics/professor.types'
import type { MinimalSubject } from '@/types/academics/subject.types'

/**
 * Rendered at build time and never regenerated: the URL space is fixed by
 * `generateStaticParams`, and nothing here reads a request-time API. Pinned so a
 * later edit cannot quietly turn the route dynamic — remove these two lines if
 * the page ever needs `cookies()`/`headers()`/search params.
 */
export const dynamic = 'force-static'
export const revalidate = false

export const dynamicParams = false

export const generateStaticParams =
  createAcademicStaticParams<ProfessorRouteParams>(
    professorStaticParamsQuery,
    'professors-static-params'
  )

export const generateMetadata = createAcademicMetadata<
  ProfessorDetail,
  ProfessorRouteParams
>({
  query: professorDetailQuery,
  getPath: (p) =>
    getAcademicPath({ type: 'professor', professorSlug: p.professorSlug }),
  entityLabel: UI_STRINGS.academics.entity.professor,
  fetchOriginPrefix: 'professor',
  getOwnSlug: (p) => p.professorSlug,
  getDescription: (professor) => professor.bio,
  descriptionFallback: (professor) =>
    UI_STRINGS.academics.metadata.professorDescription(professor.name),
})

export default async function ProfessorDetailPage({
  params,
}: AcademicDetailPageProps<ProfessorRouteParams>) {
  const routeParams = await params
  const professor = await fetchAcademicDetailOrNotFound<ProfessorDetail>({
    query: professorDetailQuery,
    params: routeParams,
    fetchOrigin: `professor-detail-${routeParams.professorSlug}`,
  })

  return (
    <PageLayout
      header={{
        greeting:
          professor.title ?? UI_STRINGS.academics.professor.academicStaff,
        title: professor.name,
        actions: professor.universities?.flatMap((university) =>
          university.slug
            ? [
                <BackLink
                  key={university._id}
                  href={getAcademicPath({
                    type: 'university',
                    universitySlug: university.slug,
                  })}
                  label={university.name}
                />,
              ]
            : []
        ),
      }}
      sidebar={
        <>
          <ProfessorContactCard
            office={professor.office}
            telephone={professor.telephone}
            email={professor.email}
            website={professor.website}
            picture={professor.picture}
            name={professor.name}
          >
            {professor.dbId ? (
              <RatingsSection
                key={`ratings-${professor.dbId}`}
                targetType='professor'
                targetId={professor.dbId}
              />
            ) : null}
          </ProfessorContactCard>
          <ProfessorAffiliationsCard faculties={professor.faculties} />
        </>
      }
    >
      <ProfessorBiographyCard bio={professor.bio} />
      <SubjectsExplorer
        subjects={
          professor.subjects.map(
            ({ professors: _, ...subject }) => subject
          ) as Array<MinimalSubject> // TODO: Fix this in a better way, since theres no need to display professors in the subjects on professor page
        }
      />
      {professor.dbId && (
        <>
          <Divider />
          <ProfessorComments
            key={professor.dbId}
            professorId={professor.dbId}
          />
        </>
      )}
    </PageLayout>
  )
}
