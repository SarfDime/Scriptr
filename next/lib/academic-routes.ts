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

const cleanEntityId = (id: string): string =>
  id.startsWith('drafts.') ? id.slice('drafts.'.length) : id

export const getAcademicPath = (input: AcademicPathInput): string => {
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
