import type {
  CommentAuthorSummary,
  CommentEngagement,
} from '@shared/types/comments.types'
import type { PortableTextValue } from '@shared/types/portable-text.types'
import type { CommentTarget } from '@/lib/api/comments-api'

export type CommentEntity = CommentEngagement & {
  id: string
  content: PortableTextValue
  author: CommentAuthorSummary | null
  parent_id: string | null
  created_at: string
  replies?: Array<CommentEntity>
}

export type CommentSectionProps = {
  target: CommentTarget
  initialComments: Array<CommentEntity>
}
