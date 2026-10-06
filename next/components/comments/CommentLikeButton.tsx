'use client'

import { COMMENT_STRINGS } from '@shared/strings/comments-strings'
import { VoteButton } from '@/components/ui/VoteButton'
import type { CommentLikeButtonProps } from '@/types/components/comments/CommentThread.types'
import { useCommentsServices } from './CommentsProvider'

/** Comment like: the generic `VoteButton` bound to the like endpoint. */
export function CommentLikeButton({
  commentId,
  initialLiked,
  initialCount,
}: CommentLikeButtonProps) {
  const { api } = useCommentsServices()

  return (
    <VoteButton
      initialVoted={initialLiked}
      initialCount={initialCount}
      action={async () => {
        const result = await api.toggleLike(commentId)
        return { voted: result.liked }
      }}
      label={COMMENT_STRINGS.actions.like}
      noun={COMMENT_STRINGS.general.commentNoun}
      variant='compact'
    />
  )
}
