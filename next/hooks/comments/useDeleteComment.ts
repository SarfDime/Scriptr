'use client'

import { COMMENT_STRINGS } from '@shared/strings/comments-strings'
import { useState } from 'react'
import { useCommentsServices } from '@/components/comments/CommentsProvider'
import { useToast } from '@/providers/toaster/ToasterProvider'

export function useDeleteComment(commentId: string) {
  const { api, removeComment } = useCommentsServices()
  const { addToast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const remove = async () => {
    setIsDeleting(true)
    try {
      await api.deleteComment(commentId)
      // Removing it from the tree unmounts the comment — no need to reset
      // isDeleting on the success path.
      removeComment(commentId)
    } catch {
      setIsDeleting(false)
      addToast({
        type: 'error',
        title: COMMENT_STRINGS.deletion.error,
        description: COMMENT_STRINGS.general.tryAgain,
      })
    }
  }

  return { isDeleting, remove }
}
