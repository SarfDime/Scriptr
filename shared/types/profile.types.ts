import type { Tables } from './database.types'
import type { PortableTextValue } from './portable-text.types'
import type { ScriptFile } from './scripts.types'

export type UserRole = 'student' | 'moderator' | 'admin'
export type ProfileSubjectStatus = 'completed' | 'currently_taking'

export type ProfileSubjectRow = {
  subject_id: string
  status: ProfileSubjectStatus
  updated_at: string
}

export type ProfileSubjectSelection = {
  subject_id: string
  status: string
  updated_at: string
  subject: Tables<'subjects'> | null
}

export type ProfileFacultySelection = {
  faculty_id: string
  created_at: string
  faculty: FacultyWithUniversity | null
}

export type ProfileStudySelection = {
  study_id: string
  created_at: string
  study: StudyWithFacultyAndUniversity | null
}

export type FavoriteScriptRecord = {
  created_at: string
  script: {
    id: string
    title: PortableTextValue
    description: PortableTextValue | null
    subject_id: string
    professor_id: string
    author_id: string
    exam_session: string | null
    additional_reading: Array<string>
    vote_score: number
    download_count: number
    created_at: string
    updated_at: string
    files: Array<ScriptFile>
  } | null
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
 * `comments` is attached from the `get_script_comment_counts` RPC, so it
 * arrives as a one-element array, not a number.
 */
export type ProfileScriptSummary = {
  id: string
  title: PortableTextValue
  description: PortableTextValue | null
  vote_score: number
  download_count: number
  created_at: string
  updated_at: string
  subject: { name: string } | null
  author: { username: string; full_name: string | null } | null
  comments: Array<{ count: number }>
  files: Array<ScriptFile>
}

/**
 * Matches PROFILE_ACHIEVEMENTS_SELECT in hono/src/routes/profiles.ts. `metric`
 * and `rarity` are plain strings because the DB columns are `text`; narrow
 * them with `isAchievementMetric` / `isAchievementRarity` from
 * `shared/config/achievements.ts`. `achievement` is nullable because it comes
 * from an embedded relationship.
 */
export type ProfileAchievement = {
  achievement_id: string
  earned_at: string
  achievement: {
    title: string
    description: string | null
    metric: string
    threshold: number
    rarity: string
  } | null
}

/** The fields GET /profiles/me, GET /profiles/:id, and GET
 * /profiles/username/:username all return identically — a viewer can
 * render any profile (their own or someone else's) through this one
 * shape, favorited scripts included (favorites are public: the
 * `script_favorites` SELECT policy is `true`, confirmed against
 * pg_policies). `bio` and
 * `location` have no backing columns on `profiles` (confirmed against
 * database.types.ts) — ProfileCard currently gets empty strings for
 * those two fields until the schema has somewhere to put them. */
export type ProfileCore = Tables<'profiles'> & {
  subjects: Array<ProfileSubjectRow>
  achievements: Array<ProfileAchievement>
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

/** Body of `PATCH /api/profiles/me` (and the admin `PATCH /api/profiles/:id`).
 * `username` is required on every call; the other fields are only written
 * when present. The selection id arrays are a full replacement of that
 * user's faculty/study selections, not an add-only list. */
export type ProfileUpdateRequest = {
  username: string
  full_name?: string
  selected_faculty_ids?: Array<string>
  selected_study_ids?: Array<string>
}

/** Success body of `PATCH /api/profiles/me` and `PATCH /api/profiles/:id`. */
export type ProfileUpdateResponse = {
  success: true
  profile: Tables<'profiles'>
}

/** `409` body of `PATCH /api/profiles/me` and `PATCH /api/profiles/:id`
 * when the requested username is already taken. `field` lets a form pin
 * the error to the username input, same as the register conflict body. */
export type ProfileUpdateConflictResponse = {
  error: string
  field: 'username'
}

/** `GET /api/profiles/:id/stats`'s shape — public, no auth required. */
export type ProfileStats = {
  scripts_uploaded: number
  total_votes_received: number
  total_downloads: number
  comments_made: number
}
