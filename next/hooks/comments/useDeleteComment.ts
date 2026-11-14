'use client'

import { COMMENT_STRINGS_PACK } from '@shared/strings/comments-strings'
import { useState } from 'react'
import { useCommentsServices } from '@/components/comments/CommentsProvider'
import { useStrings } from '@/providers/locale/use-strings'
import { useToast } from '@/providers/toaster/ToasterProvider'

export function useDeleteComment(commentId: string) {
  const strings = useStrings(COMMENT_STRINGS_PACK)
  const { api, removeComment } = useCommentsServices()
  const { addToast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const remove = async () => {
    setIsDeleting(true)
    try {
      const result = await api.deleteComment(commentId)
      // Removing it from the tree unmounts the comment — no need to reset
      // isDeleting on the success path.
      removeComment(commentId, result.totalCommentCount)
    } catch {
      setIsDeleting(false)
      addToast({
        type: 'error',
        title: strings.deletion.error,
        description: strings.general.tryAgain,
      })
    }
  }

  return { isDeleting, remove }
}
