import type {
  FacultyRouteParams,
  ProfessorRouteParams,
  StudyRouteParams,
  SubjectRouteParams,
  UniversityRouteParams,
} from '@/types/academics/academics.types'

/**
 * One of the routes an academic entity is served at. The slug tuples come from
 * the route-param types, which are themselves derived from the Sanity
 * static-params queries — so a slug the catalog query can return is a slug this
 * builder accepts, and the two cannot drift apart.
 *
 * `script` is the exception: scripts live in Postgres, so there is no query
 * result to derive from.
 */
export type AcademicPathInput =
  | ({ type: 'university' } & UniversityRouteParams)
  | ({ type: 'faculty' } & FacultyRouteParams)
  | ({ type: 'study' } & StudyRouteParams)
  | ({ type: 'subject' } & SubjectRouteParams)
  | ({ type: 'professor' } & ProfessorRouteParams)
  | { type: 'script'; scriptSlug: string }

/**
 * A slug the schema requires can still be absent at runtime: a doc saved before
 * the validation, a published field cleared in the Studio, or a payload cached
 * in a shape that predates the field. That used to throw from `startsWith` and
 * take the whole page down (see the profile cache note in
 * `lib/api/profile-api.ts`), so a missing value is handled here instead.
 */
const cleanEntityId = (id: string | null | undefined): string => {
  if (!id) return ''
  return id.startsWith('drafts.') ? id.slice('drafts.'.length) : id
}

const buildAcademicPath = (input: AcademicPathInput): string => {
  switch (input.type) {
    case 'university':
      return `/university/${cleanEntityId(input.universitySlug)}`
    case 'faculty':
      return `/university/${cleanEntityId(input.universitySlug)}/faculty/${cleanEntityId(input.facultySlug)}`
    case 'study':
      return `/university/${cleanEntityId(input.universitySlug)}/faculty/${cleanEntityId(input.facultySlug)}/study/${cleanEntityId(input.studySlug)}`
    case 'subject':
      return `/university/${cleanEntityId(input.universitySlug)}/faculty/${cleanEntityId(input.facultySlug)}/study/${cleanEntityId(input.studySlug)}/subject/${cleanEntityId(input.subjectSlug)}`
    case 'professor':
      return `/professor/${cleanEntityId(input.professorSlug)}`
    case 'script':
      return `/scripts/${cleanEntityId(input.scriptSlug)}`
    default:
      return '/'
  }
}

/** A link with an empty segment (`/university//study/x`) is broken anyway, so a
 * path built from a missing slug resolves to the index rather than being
 * minted. Cards keep rendering and the bad doc is a data problem to fix. */
export const getAcademicPath = (input: AcademicPathInput): string => {
  const path = buildAcademicPath(input)
  return path.includes('//') ? '/' : path
}
