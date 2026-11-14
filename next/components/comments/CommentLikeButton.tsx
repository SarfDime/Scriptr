'use client'

import { COMMENT_STRINGS_PACK } from '@shared/strings/comments-strings'
import { VoteButton } from '@/components/ui/VoteButton'
import { useStrings } from '@/providers/locale/use-strings'
import type { CommentLikeButtonProps } from '@/types/components/comments/CommentThread.types'
import { useCommentsServices } from './CommentsProvider'

/** Comment like: the generic `VoteButton` bound to the like endpoint. */
export function CommentLikeButton({
  commentId,
  initialLiked,
  initialCount,
  disabled = false,
}: CommentLikeButtonProps) {
  const strings = useStrings(COMMENT_STRINGS_PACK)
  const { api } = useCommentsServices()

  return (
    <VoteButton
      initialVoted={initialLiked}
      initialCount={initialCount}
      action={async () => {
        const result = await api.toggleLike(commentId)
        return { voted: result.liked }
      }}
      label={strings.actions.like}
      noun={strings.general.commentNoun}
      variant='compact'
      disabled={disabled}
    />
  )
}
