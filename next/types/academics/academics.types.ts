import type {
  FacultyStaticParamsQueryResult,
  ProfessorStaticParamsQueryResult,
  StudyStaticParamsQueryResult,
  SubjectStaticParamsQueryResult,
  UniversityStaticParamsQueryResult,
} from '@shared/types/sanity.types'
import type { LocalePageProps } from '@/types/localization.types'

export type AcademicDetailPageProps<
  TParams extends Record<string, string> = { slug: string },
> = LocalePageProps<TParams>

/**
 * The params each academic route is served at, taken from the Sanity
 * static-params query that enumerates it. `generateStaticParams` returns exactly
 * these, `generateMetadata` and the page receive exactly these, and
 * `getAcademicPath` builds a URL from exactly these — one shape, so a query
 * change surfaces here instead of silently disagreeing.
 */
export type UniversityRouteParams = UniversityStaticParamsQueryResult[number]
export type FacultyRouteParams = FacultyStaticParamsQueryResult[number]
export type StudyRouteParams = StudyStaticParamsQueryResult[number]
export type SubjectRouteParams = SubjectStaticParamsQueryResult[number]
export type ProfessorRouteParams = ProfessorStaticParamsQueryResult[number]

/**
 * The study site is addressed by its permanent handle alone; everything the
 * shared academic queries need is resolved from it (`getStudySite`).
 */
export type StudySiteRouteParams = { siteSlug: string }

export type SubjectSiteRouteParams = {
  siteSlug: string
  subjectSlug: string
}

export type MinimalEntity = {
  _id: string
  name: string
  dbId?: string
  slug?: string
}

// Extracted shared contact properties
export type ContactInfo = {
  telephone?: string
  email?: string
  website?: string
}

// Extracted relation type used inside SubjectDetail and ProfessorDetail
export type RelatedFaculty = MinimalEntity & {
  university?: MinimalEntity
}

// Extracted relation type used inside SubjectDetail and ProfessorDetail
export type RelatedStudy = MinimalEntity & {
  faculty?: RelatedFaculty
}
