import type { ExamSession } from './academic.types'
import type { FileType, ScriptFileInput } from './api.types'
import type { Tables } from './database.types'
import type { PortableTextValue } from './portable-text.types'

/** Matches `script_files(id, file_url, file_type, file_size_bytes, bucket, position, file_name, created_at)`. */
export type ScriptFile = {
  id: string
  file_url: string
  file_type: FileType
  file_size_bytes: number
  bucket: string
  position: number
  /** Kebab-case, no extension. `null` for files uploaded before names were
   * kept; the UI falls back to a positional label. */
  file_name: string | null
  created_at: string
}

/** Matches `author:profiles(username, full_name, avatar_url)`. Every select
 * that returns this shape must include `avatar_url`. */
export type ScriptAuthorSummary = {
  username: string | null
  full_name: string | null
  avatar_url: string | null
}

/** Matches `study:studies(sanity_id)`. `sanity_id` drives client-side Sanity
 * queries for faculty/university/professor metadata. */
export type ScriptStudyRef = {
  sanity_id: string | null
}

/**
 * Matches the `subject:subjects(name, sanity_id, study:studies(sanity_id))`
 * join — deliberately thin. Everything else a UI needs about the subject
 * (name, description, syllabus, professors, ...) comes from Sanity via
 * `sanity_id`, fetched separately — see ScriptDetailPage's second-stage fetch
 * with `subjectByIdQuery`. This replaces the previous deep DB join
 * (name/university chain duplicated from Sanity, which ARCHITECTURE.md §1
 * already establishes as the source of truth for that data).
 *
 * There is no faculty on it: scripts are not scoped by faculty any more.
 */
export type ScriptSubjectRef = {
  name: string
  sanity_id: string | null
  study: {
    sanity_id: string | null
  } | null
}

/** Matches `subject:subjects(name, study:studies(sanity_id))`. */
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
  /** Year the exam session sits in; `null` for "general (all years)". */
  exam_year: number | null
  additional_reading: Array<string>
  vote_score: number
  download_count: number
  created_at: string
  updated_at: string
  comments: Array<{ count: number }>
  files: Array<ScriptFile>
  author: ScriptAuthorSummary | null
  subject: ScriptSubjectRef | null
}

/** Shallow `study` shape used by `PATCH /:id`, `GET /my-scripts`, and
 * `GET /flagged/all` — study name only, no `sanity_id`. None of those three
 * endpoints need Sanity resolution on their response. */
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

/** `PATCH /:id`'s response: `{ success, script }`. */
export type ScriptPatchResponse = {
  success: true
  script: ScriptPatchResult
}

/** `PATCH /:id` body. `description: null` clears it; `exam_session: null` is
 * the general (all sessions) option and `exam_year: null` the general (all
 * years) one. */
export type ScriptUpdateInput = {
  title: PortableTextValue
  description: PortableTextValue | null
  additional_reading: Array<string>
  exam_session: ExamSession | null
  exam_year: number | null
}

/** `DELETE /:id` and `DELETE /:scriptId/files/:fileId`. */
export type ScriptDeleteResponse = { success: true; message: string }

/** `POST /:id/files`: the rows that were attached. */
export type ScriptAttachFilesResponse = {
  success: true
  files: Array<ScriptFile>
}

export type DownloadResponse = { success: true; counted: boolean }

export type UploadResponse = { success: true; files: Array<ScriptFileInput> }
export type CreateScriptResponse = { success: true; script: { id: string } }
