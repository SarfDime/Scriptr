import type { ProfileSubjectStatus } from './api.types'
import type { Tables } from './database.types'
import type { PortableTextValue } from './portable-text.types'
import type { ScriptFile } from './scripts.types'

export type ProfileSubjectRow = {
  subject_id: string
  status: ProfileSubjectStatus
  updated_at: string
}

/** Matches `university:universities(id, name)` — id/name only, not the full row. */
export type UniversitySummary = {
  id: string
  name: string
}

/** Matches `faculty:faculties(*, university:universities(id, name))`. */
export type FacultyWithUniversity = Tables<'faculties'> & {
  university: UniversitySummary | null
}

/** Matches `study:studies(*, faculty:faculties(*, university:universities(id, name)))`. */
export type StudyWithFacultyAndUniversity = Tables<'studies'> & {
  faculty: FacultyWithUniversity | null
}

/**
 * Matches PROFILE_SCRIPT_FIELDS in hono/src/routes/profiles.ts — the
 * projection used for both a profile's authored scripts and its
 * favorited scripts (same shape, reached through different relationships
 * server-side). No professor or subject year: `scripts.professor_id` has
 * no direct FK to `professors.id` (only a composite FK to
 * `subject_professors`), and Postgres `subjects` has no `year` column at
 * all (year only exists in Sanity) — confirmed against the live schema.
 * `comments` is PostgREST's count-aggregate embed (`comments(count)`), so
 * it arrives as a one-element array, not a number.
 */
export type ProfileScriptSummary = {
  id: string
  title: PortableTextValue
  vote_score: number
  download_count: number
  created_at: string
  updated_at: string
  subject: { name: string } | null
  author: { username: string; full_name: string | null } | null
  comments: Array<{ count: number }>
  files: Array<ScriptFile>
}

/** The fields GET /profiles/me, GET /profiles/:id, and GET
 * /profiles/username/:username all return identically — a viewer can
 * render any profile (their own or someone else's) through this one
 * shape, favorited scripts included (favorite_scripts is a deliberate
 * product choice to make favorites public, not an RLS default — see
 * PROFILE_FAVORITE_SCRIPTS_SELECT's comment in profiles.ts). `bio` and
 * `location` have no backing columns on `profiles` (confirmed against
 * database.types.ts) — ProfileCard currently gets empty strings for
 * those two fields until the schema has somewhere to put them. */
export type ProfileCore = Tables<'profiles'> & {
  subjects: Array<ProfileSubjectRow>
  selected_faculties: Array<{ faculty: FacultyWithUniversity | null }>
  selected_studies: Array<{ study: StudyWithFacultyAndUniversity | null }>
  scripts: Array<ProfileScriptSummary>
  favorite_scripts: Array<ProfileScriptSummary>
}

/** `GET /api/profiles/me`'s shape. Kept as a distinct name from
 * `ProfileCore` for clarity at call sites ("this is the signed-in
 * viewer's own profile"), even though today it's a plain alias with no
 * additional fields — /me and the two public read endpoints return
 * identical shapes now. */
export type MyProfileResponse = ProfileCore

/** `GET /api/profiles/:id` and `GET /api/profiles/username/:username`'s
 * shape — an arbitrary user's profile, viewable by anyone. Same
 * rationale as `MyProfileResponse` above for keeping a distinct name. */
export type PublicProfileResponse = ProfileCore

/** `GET /api/profiles/:id/stats`'s shape — public, no auth required. */
export type ProfileStats = {
  scripts_uploaded: number
  total_votes_received: number
  total_downloads: number
  comments_made: number
}
