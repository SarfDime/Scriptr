import { UI_STRINGS_PACK } from '@shared/config/strings'
import { ProfessorAffiliationsCard } from '@/components/academics/professor/ProfessorAffiliationsCard'
import { ProfessorComments } from '@/components/academics/professor/ProfessorComments'
import { ProfessorContactCard } from '@/components/academics/professor/ProfessorContactCard'
import { SubjectsExplorer } from '@/components/academics/subject/SubjectsExplorer'
import { BackLink } from '@/components/common/BackLink'
import { PageLayout } from '@/components/layout/PageLayout'
import { RatingsSection } from '@/components/ratings/RatingsSection'
import { Divider } from '@/components/ui/Divider'
import {
  createAcademicStaticParams,
  fetchAcademicDetailOrNotFound,
} from '@/lib/academic-detail-page'
import { createAcademicMetadata } from '@/lib/academic-metadata'
import { getAcademicPath } from '@/lib/academic-routes'
import { ACADEMIC_PAGE_TAGS } from '@/lib/sanity-tags'
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
  createAcademicStaticParams<ProfessorRouteParams>(
    professorStaticParamsQuery,
    'professors-static-params',
    ACADEMIC_PAGE_TAGS.professor
  )

export const generateMetadata = createAcademicMetadata<
  ProfessorDetail,
  ProfessorRouteParams
>({
  query: professorDetailQuery,
  getPath: (p, locale) =>
    getAcademicPath(
      { type: 'professor', professorSlug: p.professorSlug },
      locale
    ),
  entityLabel: (strings) => strings.academics.entity.professor,
  fetchOriginPrefix: 'professor',
  tags: ACADEMIC_PAGE_TAGS.professor,
  getOwnSlug: (p) => p.professorSlug,
  getDescription: (professor) => professor.bio,
  descriptionFallback: (professor, strings) =>
    strings.academics.metadata.professorDescription(professor.name),
})

export default async function ProfessorDetailPage({
  params,
}: AcademicDetailPageProps<ProfessorRouteParams>) {
  const routeParams = await params
  const { locale } = routeParams
  const professor = await fetchAcademicDetailOrNotFound<ProfessorDetail>({
    query: professorDetailQuery,
    params: routeParams,
    fetchOrigin: `professor-detail-${routeParams.professorSlug}`,
    tags: ACADEMIC_PAGE_TAGS.professor,
  })

  return (
    <PageLayout
      header={{
        // The header resolves the entry itself, so this page reads no copy.
        greeting:
          professor.title ?? UI_STRINGS_PACK.academics.professor.academicStaff,
        title: professor.name,
        actions: professor.universities?.flatMap((university) =>
          university.slug
            ? [
                <BackLink
                  key={university._id}
                  href={getAcademicPath(
                    { type: 'university', universitySlug: university.slug },
                    locale
                  )}
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
