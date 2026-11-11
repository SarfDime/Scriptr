import type { AdminProfileSortField } from '../config/shared-constants'
import type { SortDirection } from '../utils/array-utils/sort'
import type { Tables } from './database.types'
import type { PortableTextValue } from './portable-text.types'
import type { ScriptFile } from './scripts.types'

export type UserRole = 'student' | 'owner'

/** A role held on one study. An admin satisfies every moderator check. */
export type StudyRole = 'admin' | 'moderator'

export type StudyRoleAssignment = {
  study_id: string
  role: StudyRole
}
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
  /** Address segment of the script's page — see `ScriptSummary.slug`. */
  slug: string
  /** The script's study, whose site handle puts the page under `/study/…`. */
  study: { site_slug: string | null } | null
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
/** A definition's study, when it has one: a study achievement is earned inside
 * that study, a global one (`study: null`) anywhere. */
export type AchievementStudy = {
  id: string
  name: string
  site_slug: string | null
}

export type ProfileAchievement = {
  achievement_id: string
  earned_at: string
  achievement: {
    title: string
    description: string | null
    metric: string
    threshold: number
    rarity: string
    study: AchievementStudy | null
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

/** Columns the admin user manager lists and edits. */
export type AdminProfileFields = Pick<
  Tables<'profiles'>,
  | 'id'
  | 'username'
  | 'full_name'
  | 'role'
  | 'avatar_url'
  | 'created_at'
  | 'updated_at'
>

/** A selected faculty or study, as the admin listing embeds it. PostgREST
 * embeds a to-one row under the table's name, and `null` when the joined row
 * is missing. */
export type AdminProfileFacultyRef = {
  faculty: { id: string; name: string } | null
}
export type AdminProfileStudyRef = {
  study: { id: string; name: string } | null
}

/** One row of `GET /api/profiles` (admin only): only the columns that route
 * selects. `subjects.status` is the generated column type (`string`), not the
 * `ProfileSubjectStatus` union the public profile shapes use, because this
 * shape is what PostgREST infers for the embed. */
export type AdminProfileListItem = AdminProfileFields & {
  subjects: Array<
    Pick<Tables<'profile_subjects'>, 'subject_id' | 'status' | 'updated_at'>
  >
  faculties: Array<AdminProfileFacultyRef>
  studies: Array<AdminProfileStudyRef>
}

/** `GET /api/profiles`'s shape — one page of profiles, with the total the
 * pagination control needs. Admin only. */
export type AdminProfilesListResponse = {
  profiles: Array<AdminProfileListItem>
  total: number
  limit: number
  offset: number
}

/** `GET /api/profiles/:id/admin`'s shape: the editable columns plus the
 * numbers and selection names the management dialogs show. */
export type AdminProfileDetail = {
  profile: AdminProfileFields
  counts: { scripts: number; comments: number }
  faculties: Array<{ id: string; name: string }>
  studies: Array<{ id: string; name: string }>
  /** Roles this person holds per study; empty for a plain student. */
  studyRoles: Array<{ studyId: string; studyName: string; role: StudyRole }>
}

/** `DELETE /api/profiles/:id`'s body. `auth_user_deleted` is false when the
 * profile row was removed but the Supabase Auth login could not be, which
 * leaves an account that can sign in with no profile. */
export type AdminProfileDeleteResponse = {
  success: true
  auth_user_deleted: boolean
}

/** Success body of `PATCH /api/admin/profiles/:id/role`. */
export type AdminProfileRoleResponse = {
  success: true
  profile: Tables<'profiles'>
}

/** Columns the admin listing accepts as `sort`, and the shape of its query
 * string. `limit`/`offset` mirror the comment routes. */
export type AdminProfilesQuery = {
  limit?: number
  offset?: number
  /** Matches `username` or `full_name`, case-insensitively. */
  search?: string
  role?: UserRole
  sort?: AdminProfileSortField
  order?: SortDirection
}

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
