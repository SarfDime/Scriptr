import type { CommentSort } from '@shared/config/shared-constants'
import type { SessionUser } from '@shared/types/auth.types'
import type { PortableTextValue } from '@shared/types/portable-text.types'
import type { ReactNode } from 'react'
import type * as commentsApi from '@/lib/api/comments-api'
import type { CommentEntity, CommentSectionProps } from './Comments.types'

/** The slice of the comments API the UI depends on. Components get it from
 * `CommentsProvider` rather than importing the functions, so a different
 * backend (or a test double) can be swapped in without touching them. */
export type CommentsApi = Pick<
  typeof commentsApi,
  | 'deleteComment'
  | 'getCommentReplies'
  | 'getTargetComments'
  | 'patchComment'
  | 'postComment'
  | 'postReaction'
  | 'postReply'
  | 'toggleLike'
>

/** What readers of the tree need. */
export type CommentsStateValue = {
  comments: Array<CommentEntity>
  commentCount: number
  sort: CommentSort
  hasMoreComments: boolean
  isLoadingComments: boolean
  commentsError?: string
  loadingReplyIds: ReadonlySet<string>
  replyErrors: Readonly<Record<string, string>>
  setSort: (sort: CommentSort) => void
  loadMoreComments: () => void
  loadMoreReplies: (commentId: string) => void
  loadMoreThreadReplies: (commentId: string) => void
}

/** What writers need: the target, the API, who's viewing, and the tree mutations. */
export type CommentsServicesValue = {
  target: CommentSectionProps['target']
  api: CommentsApi
  currentUserId?: string
  currentUserRole?: SessionUser['role']
  addComment: (comment: CommentEntity) => void
  addReply: (parentId: string, reply: CommentEntity) => void
  updateComment: (comment: CommentEntity) => void
  removeComment: (commentId: string, totalCommentCount?: number) => void
}

export type CommentsProviderProps = CommentSectionProps & {
  /** Defaults to the real comments API. */
  api?: CommentsApi
  children: ReactNode
}

export type CommentItemProps = {
  comment: CommentEntity
  depth: number
  /** Name of the comment this one replies to; only shown once replies are flattened. */
  parentAuthorName?: string
  showNestedReplies?: boolean
}

export type CommentAuthorAvatarProps = {
  name: string
  avatarUrl?: string | null
  isRoot: boolean
}

export type CommentHeaderProps = {
  author: CommentEntity['author']
  createdAt: string
  isRoot: boolean
  edited?: boolean
  /** Set when the comment is a flattened deep reply. */
  replyingTo?: string
}

/** Just the fields the action row reads — not the whole comment. */
export type CommentActionsData = Pick<
  CommentEntity,
  | 'id'
  | 'author_id'
  | 'liked_by_me'
  | 'likes_count'
  | 'my_reactions'
  | 'reactions_by_type'
>

export type CommentActionsProps = {
  comment: CommentActionsData
  isReplyOpen: boolean
  onToggleReply: () => void
  onEdit: () => void
}

export type CommentReactionsProps = {
  commentId: string
  initialMine: CommentEntity['my_reactions']
  initialCounts: CommentEntity['reactions_by_type']
  disabled?: boolean
}

export type CommentLikeButtonProps = {
  commentId: string
  initialLiked: boolean
  initialCount: number
  disabled?: boolean
}

export type CommentEditorProps = {
  onChange: (value: PortableTextValue) => void
  ariaLabel: string
  initialContent?: PortableTextValue
  autoFocus?: boolean
  className?: string
}
