import type {
  CommentAuthorSummary,
  CommentEngagement,
  CommentPage,
} from '@shared/types/comments.types'
import type { PortableTextValue } from '@shared/types/portable-text.types'
import type { CommentTarget } from '@/lib/api/comments-api'

export type CommentEntity = CommentEngagement & {
  id: string
  author_id: string
  content: PortableTextValue
  author: CommentAuthorSummary | null
  parent_id: string | null
  created_at: string
  edited: boolean
  replies?: Array<CommentEntity>
  has_replies?: boolean
  replies_has_more?: boolean
  replies_loaded?: boolean
  replies_loaded_count?: number
  initial_replies_count?: number
}

export type CommentSectionProps = {
  target: CommentTarget
  initialComments: CommentPage<CommentEntity>
  initialLoadFailed?: boolean
  /** The study the target lives in; moderation is scoped to it. Professor
   * threads are not study-scoped, so they omit it and only owners moderate. */
  studyId?: string | null
}
