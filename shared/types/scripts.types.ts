import type { FileType, ScriptFileInput } from './api.types'
import type { Tables } from './database.types'
import type { PortableTextValue } from './portable-text.types'

/** Matches `script_files(id, file_url, file_type, file_size_bytes, bucket, position, created_at)`. */
export type ScriptFile = {
  id: string
  file_url: string
  file_type: FileType
  file_size_bytes: number
  bucket: string
  position: number
  created_at: string
}

/** Matches `author:profiles(username, full_name)`. */
export type ScriptAuthorSummary = {
  username: string | null
  full_name: string | null
}

/** Matches `study:studies(sanity_id, faculty_id)`. `sanity_id` drives
 * client-side Sanity queries for faculty/university/professor metadata;
 * `faculty_id` is server-side-only, for faculty scoping. */
export type ScriptStudyRef = {
  sanity_id: string | null
  faculty_id: string
}

/**
 * Matches the current `subject:subjects(sanity_id, study:studies(sanity_id, faculty:
 * faculties(sanity_id)))` join — deliberately thin. `study.faculty.id` is kept
 * only because `applySelectedFacultyScope` (hono/src/routes/scripts.ts)
 * filters on it server-side; everything else a UI needs about the subject
 * (name, description, syllabus, professors, ...) comes from Sanity via
 * `sanity_id` now, fetched separately — see ScriptDetailPage's second-stage
 * fetch with `subjectByIdQuery`. This replaces the previous deep DB join
 * (name/university chain duplicated from Sanity, which ARCHITECTURE.md §1
 * already establishes as the source of truth for that data).
 */
export type ScriptSubjectRef = {
  sanity_id: string | null
  study: {
    sanity_id: string | null
    faculty: {
      sanity_id: string | null
      id: string
    } | null
  } | null
}

/** Matches `subject:subjects(name, study:studies(sanity_id, faculty_id))`. */
export type ScriptSubjectSummary = {
  name: string
  study: ScriptStudyRef | null
}

/**
 * Shape returned by every `SCRIPT_SUMMARY_SELECT` endpoint in
 * hono/src/routes/scripts.ts — `/`, `/subject/:subjectId`, `/top`,
 * `/popular`, `/search` each return `Array<ScriptSummary>` directly (no
 * wrapper object), and `/:id` returns a single `ScriptSummary` directly.
 * `POST /scripts`'s `{ success, script, message }` wraps this same shape.
 *
 * `professor_id` is included because the route selects it, but there is no
 * `professor:professors(...)` join in `SCRIPT_SUMMARY_SELECT` — these
 * endpoints never return a professor name.
 */
export type ScriptSummary = {
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
  author: ScriptAuthorSummary | null
  subject: ScriptSubjectRef | null
}

/** Shallow `study` shape used by `PATCH /:id`, `GET /my-scripts`, and
 * `GET /flagged/all` — study name only, no `sanity_id`/`faculty_id`. None
 * of those three endpoints need Sanity resolution or faculty scoping on
 * their response. */
type ScriptStudyNameOnly = {
  name: string
  study: { name: string } | null
}

/** `Tables<'scripts'>` with `title`/`description` narrowed from raw `Json`
 * to `PortableTextValue` — every endpoint below that selects full script
 * columns (`MyScriptSummary`, `ScriptPatchResult`, `ScriptFlaggedSummary`)
 * needs this, for the same reason `ScriptSummary` hand-writes those two
 * fields instead of inheriting them from `Tables<'scripts'>` directly. */
type ScriptRowWithPortableText = Omit<
  Tables<'scripts'>,
  'title' | 'description'
> & {
  title: PortableTextValue
  description: PortableTextValue | null
}

/**
 * `GET /my-scripts`'s shape: every `scripts` column (including internal
 * ones `SCRIPT_SUMMARY_SELECT` deliberately excludes, e.g. `is_flagged`)
 * plus the shallow `subject` join above, and no `author`/`files` join at
 * all. Response is wrapped: `{ scripts: [...] }`.
 */
export type MyScriptSummary = ScriptRowWithPortableText & {
  subject: ScriptStudyNameOnly | null
}

/**
 * `PATCH /:id`'s response shape: every `scripts` column plus
 * `author:profiles(username, full_name)` and the shallow `subject` join
 * above. Response is wrapped: `{ success, script }`.
 */
export type ScriptPatchResult = ScriptRowWithPortableText & {
  author: ScriptAuthorSummary | null
  subject: ScriptStudyNameOnly | null
}

/**
 * `GET /flagged/all`'s shape (admin only): every `scripts` column plus
 * author/subject (same shallow join as `ScriptPatchResult`) and every flag
 * against it, each with its reporter's username.
 */
export type ScriptFlaggedSummary = ScriptRowWithPortableText & {
  author: ScriptAuthorSummary | null
  subject: ScriptStudyNameOnly | null
  flags: Array<
    Tables<'flags'> & { reporter: { username: string | null } | null }
  >
}

export type DownloadResponse = { success: true; counted: boolean }

export type UploadResponse = { success: true; files: Array<ScriptFileInput> }
export type CreateScriptResponse = { success: true; script: { id: string } }
