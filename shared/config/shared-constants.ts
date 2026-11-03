import type { ExamSession } from '../types/academic.types'
import type { FileType } from '../types/api.types'

// Per docs/ARCHITECTURE-SCRIPTS-UPLOADS.md: supported file types and upload
// size limits. Keep this the single source of truth rather than repeating
// literals elsewhere.

/** Extensions accepted for upload. Legacy `.doc`/`.xls` are intentionally not
 * accepted: they can't be optimized, and every current editor exports
 * `.docx`/`.xlsx`. */
export const ALLOWED_EXTENSIONS = [
  'pdf',
  'jpg',
  'jpeg',
  'png',
  'webp',
  'md',
  'docx',
  'xlsx',
] as const satisfies ReadonlyArray<FileType>

/** Canonical Content-Type per stored file type. The server derives it from the
 * extension because browsers report it inconsistently (notably for `.md`).
 * Exhaustive on purpose: adding a `FileType` without one fails to compile. */
export const FILE_CONTENT_TYPES: Record<FileType, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  md: 'text/markdown',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

/** Hard limit on a file R2 will hold, measured after optimization. */
export const MAX_STORED_FILE_BYTES = 3.5 * 1024 * 1024

/** What the optimizer aims for. It may settle anywhere up to
 * `MAX_STORED_FILE_BYTES` when going lower would cost too much quality, but
 * never above it. */
export const TARGET_STORED_FILE_BYTES = 3 * 1024 * 1024

/** Largest *uploaded* file for types the optimizer can shrink. Anything above
 * `MAX_STORED_FILE_BYTES` relies on the optimizer to shrink it; without the
 * optimizer service the in-process stand-in rejects such files at finalize. */
export const MAX_UPLOAD_FILE_BYTES = 20 * 1024 * 1024

/** Types the optimizer can shrink, so they may be uploaded above the stored cap. */
export const OPTIMIZABLE_FILE_TYPES: ReadonlyArray<FileType> = [
  'pdf',
  'jpg',
  'jpeg',
  'png',
  'webp',
]

/** Most files accepted in a single upload. */
export const MAX_UPLOAD_FILES = 10

/** Stored files get a fresh key on every upload and are never overwritten, so
 * they can be cached forever. */
export const IMMUTABLE_FILE_CACHE_CONTROL =
  'public, max-age=31536000, immutable'

/** Exam sessions a script can be filed under, in calendar order. The month
 * decides which years are selectable for that session (see
 * `shared/utils/script-session.utils.ts`). */
export const EXAM_SESSIONS = [
  'january',
  'june',
  'september',
] as const satisfies ReadonlyArray<ExamSession>

/** Month (1-12) each exam session is held in. */
export const EXAM_SESSION_MONTHS: Record<ExamSession, number> = {
  january: 1,
  june: 6,
  september: 9,
}

/** Earliest year a script can be attributed to. */
export const SCRIPT_START_YEAR = 2023

export const REACTION_TYPES = [
  'like',
  'hate',
  'funny',
  'sad',
  'confused',
] as const

export const REACTION_TYPE_DETAILS: Record<
  (typeof REACTION_TYPES)[number],
  { emoji: string }
> = {
  like: { emoji: '👍' },
  hate: { emoji: '👎' },
  funny: { emoji: '😂' },
  sad: { emoji: '😢' },
  confused: { emoji: '😕' },
}

export const isReactionType = (
  value: string
): value is (typeof REACTION_TYPES)[number] =>
  REACTION_TYPES.some((reactionType) => reactionType === value)

/** Comments */
export const COMMENTS_SECTION_ID = 'comments'
export const COMMENTS_PAGE_SIZE = 2
export const COMMENT_REPLIES_PAGE_SIZE = 10
export const COMMENT_REPLIES_PREVIEW_SIZE = 5
export const COMMENT_SORT_OPTIONS = ['newest', 'top'] as const
export type CommentSort = (typeof COMMENT_SORT_OPTIONS)[number]
/** How many reply levels get their own indentation. Anything deeper is
 * rendered flat at the last indented level with a "replying to …" cue —
 * past ~3 levels the indent just squeezes the text, especially on mobile. */
export const MAX_THREAD_DEPTH = 2
