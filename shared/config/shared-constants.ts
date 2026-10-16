// Per ARCHITECTURE.md §3: supported file types and the current per-file cap.
// The cap is documented as "adjustable" — keep this the single source of

import type { SubjectExamSession } from '../types/academic.types'

// truth here rather than repeating the literal elsewhere if it changes.
export const ALLOWED_EXTENSIONS = [
  'pdf',
  'jpg',
  'jpeg',
  'png',
  'webp',
  'md',
  'doc',
  'docx',
  'xls',
  'xlsx',
] as const

export const SUBJECT_EXAM_SESSIONS: Array<SubjectExamSession> = [
  'january',
  'june',
  'september',
] as const

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
