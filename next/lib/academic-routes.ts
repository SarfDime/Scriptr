import { getScriptSitePath } from '@shared/utils/site-paths'
import { studySiteOrigin } from '@/lib/study-origin'
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
 * A study site's address: its own hostname, `https://lbe.scriptr.uk`. A study is
 * its own site — reachable at the catalog path too, but only so that path can
 * redirect — so an absolute address is what a link from outside the site, a
 * canonical and a sitemap entry all need.
 *
 * A study without a handle has no page of its own (the schema requires one), so
 * callers fall back to its faculty (see `buildAcademicPath`) rather than to a
 * nested URL that no longer exists. When the site origin itself is unusable the
 * catalog path is still returned: a working redirect beats no link at all.
 */
export const getStudySiteUrl = (
  siteSlug: string | null | undefined
): string => {
  const site = cleanEntityId(siteSlug)
  return site ? studySiteOrigin(site) || `/study/${site}` : '/'
}

/** A study's content surface: the scripts its students share, one level below
 * the academic overview a newcomer lands on. */
export const getStudyFeedPath = (
  siteSlug: string | null | undefined
): string => {
  const site = cleanEntityId(siteSlug)
  return site ? `${getStudySiteUrl(site)}/scripts` : '/'
}

const facultyPath = (input: {
  universitySlug: string
  facultySlug: string
}): string =>
  `/university/${cleanEntityId(input.universitySlug)}/faculty/${cleanEntityId(input.facultySlug)}`

const buildAcademicPath = (input: AcademicPathInput): string => {
  switch (input.type) {
    case 'university':
      return `/university/${cleanEntityId(input.universitySlug)}`
    case 'faculty':
      return facultyPath(input)
    case 'study': {
      const site = cleanEntityId(input.siteSlug)
      if (site) return getStudySiteUrl(site)
      return facultyPath(input)
    }
    case 'subject': {
      const site = cleanEntityId(input.siteSlug)
      if (site) {
        return `${getStudySiteUrl(site)}/subject/${cleanEntityId(input.subjectSlug)}`
      }
      return facultyPath(input)
    }
    case 'professor':
      return `/professor/${cleanEntityId(input.professorSlug)}`
    case 'script': {
      const site = cleanEntityId(input.siteSlug)
      if (site) {
        return `${getStudySiteUrl(site)}/scripts/${cleanEntityId(input.scriptSlug)}`
      }
      // The API's own path shape, for a row whose study handle was not read.
      return getScriptSitePath({ siteSlug: null, slug: input.scriptSlug })
    }
    default:
      return '/'
  }
}

/**
 * The address of an academic entity: a site-relative path for catalog pages,
 * and an absolute URL for anything inside a study's own site (see
 * `getStudySiteUrl`) — the study host *is* where those pages live, so a link
 * from the catalog has to name it.
 *
 * A link with an empty segment (`/university//study/x`) is broken anyway, so a
 * path built from a missing slug resolves to the index rather than being
 * minted. Cards keep rendering and the bad doc is a data problem to fix.
 */
export const getAcademicPath = (input: AcademicPathInput): string => {
  const path = buildAcademicPath(input)
  // Absolute addresses carry their own `//`; only the path portion is checked.
  const pathOnly = path.replace(/^https?:\/\//, '')
  return pathOnly.includes('//') ? '/' : path
}
