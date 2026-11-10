import { getScriptSitePath } from '@shared/utils/site-paths'
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
  | ({ type: 'study'; siteSlug?: string | null } & Omit<
      StudyRouteParams,
      'siteSlug'
    >)
  | ({ type: 'subject'; siteSlug?: string | null } & Omit<
      SubjectRouteParams,
      'siteSlug'
    >)
  | ({ type: 'professor' } & ProfessorRouteParams)
  | { type: 'script'; scriptSlug: string; siteSlug?: string | null }

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

/**
 * The study site's root: `/study/[siteSlug]`. A study without a handle yet is
 * still served at its nested catalog URL (see `buildAcademicPath`), which is
 * what keeps the site working while the handle is being authored.
 */
export const getStudyPath = (siteSlug: string | null | undefined): string => {
  const site = cleanEntityId(siteSlug)
  return site ? `/study/${site}` : '/'
}

const buildAcademicPath = (input: AcademicPathInput): string => {
  switch (input.type) {
    case 'university':
      return `/university/${cleanEntityId(input.universitySlug)}`
    case 'faculty':
      return `/university/${cleanEntityId(input.universitySlug)}/faculty/${cleanEntityId(input.facultySlug)}`
    case 'study': {
      const site = cleanEntityId(input.siteSlug)
      if (site) return getStudyPath(site)
      return `/university/${cleanEntityId(input.universitySlug)}/faculty/${cleanEntityId(input.facultySlug)}/study/${cleanEntityId(input.studySlug)}`
    }
    case 'subject': {
      const site = cleanEntityId(input.siteSlug)
      if (site) {
        return `${getStudyPath(site)}/subject/${cleanEntityId(input.subjectSlug)}`
      }
      return `/university/${cleanEntityId(input.universitySlug)}/faculty/${cleanEntityId(input.facultySlug)}/study/${cleanEntityId(input.studySlug)}/subject/${cleanEntityId(input.subjectSlug)}`
    }
    case 'professor':
      return `/professor/${cleanEntityId(input.professorSlug)}`
    case 'script':
      return getScriptSitePath({
        siteSlug: input.siteSlug,
        slug: input.scriptSlug,
      })
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
