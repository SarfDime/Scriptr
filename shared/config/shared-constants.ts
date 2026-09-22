// Per ARCHITECTURE.md §3: supported file types and the current per-file cap.
// The cap is documented as "adjustable" — keep this the single source of

import type { SubjectExamSession } from '@shared/types/academic.types'

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

export const REACTION_TYPES = ['👍', '❤️', '😂', '👏'] as const
