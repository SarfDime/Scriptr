'use client'

import { COMMENT_STRINGS_PACK } from '@shared/strings/comments-strings'
import type { ReactionType } from '@shared/types/comments.types'
import { useState } from 'react'
import { useCommentsServices } from '@/components/comments/CommentsProvider'
import { useProtectedAction } from '@/hooks/useProtectedAction'
import { useStrings } from '@/providers/locale/use-strings'
import type { CommentReactionsProps } from '@/types/components/comments/CommentThread.types'

/** A comment's reaction counts and the viewer's own reactions, kept in sync
 * with the server's toggle responses. */
export function useCommentReactions({
  commentId,
  initialMine,
  initialCounts,
}: CommentReactionsProps) {
  const strings = useStrings(COMMENT_STRINGS_PACK)
  const { api } = useCommentsServices()
  const [myReactions, setMyReactions] = useState(initialMine)
  const [reactionsByType, setReactionsByType] = useState(initialCounts)
  const { state, run } = useProtectedAction(api.postReaction, {
    errorTitle: strings.reactions.updateError,
  })

  const react = async (reactionType: ReactionType) => {
    const result = await run(commentId, reactionType)
    if (!result.ok) return

    setMyReactions((current) =>
      result.data.reacted
        ? [...current, reactionType]
        : current.filter((type) => type !== reactionType)
    )
    setReactionsByType((current) => ({
      ...current,
      [reactionType]: Math.max(
        0,
        (current[reactionType] ?? 0) + (result.data.reacted ? 1 : -1)
      ),
    }))
  }

  return {
    myReactions,
    reactionsByType,
    isPending: state.status === 'pending',
    react,
  }
}
