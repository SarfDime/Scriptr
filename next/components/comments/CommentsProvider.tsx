'use client'

import { createContext, useContext, useState } from 'react'
import * as defaultCommentsApi from '@/lib/api/comments-api'
import {
  addReply,
  countComments,
  nestCommentReplies,
  removeComment,
} from '@/lib/comments/comment-tree'
import { useSession } from '@/providers/SessionProvider'
import type {
  CommentsProviderProps,
  CommentsServicesValue,
  CommentsStateValue,
} from '@/types/components/comments/CommentThread.types'

// Two contexts so readers of the tree (header count, list) and writers
// (composer, reply box, action buttons) each depend only on what they use.
const CommentsStateContext = createContext<CommentsStateValue | null>(null)
const CommentsServicesContext = createContext<CommentsServicesValue | null>(
  null
)

/**
 * Owns the comment tree and everything the comment UI needs from outside:
 * the target, the API (injectable, defaults to the real one) and the current
 * user. The tree lives here, not in individual comments, and is rendered
 * straight from `comment.replies` — local copies went stale when a nested
 * reply was added or deleted.
 */
export function CommentsProvider({
  target,
  initialComments,
  api = defaultCommentsApi,
  children,
}: CommentsProviderProps) {
  const [comments, setComments] = useState(() =>
    nestCommentReplies(initialComments)
  )
  const { session } = useSession()

  const state: CommentsStateValue = {
    comments,
    commentCount: countComments(comments),
  }

  const services: CommentsServicesValue = {
    target,
    api,
    currentUserId:
      session.status === 'authenticated' ? session.user.id : undefined,
    addComment: (comment) => setComments((current) => [comment, ...current]),
    addReply: (parentId, reply) =>
      setComments((current) => addReply(current, parentId, reply)),
    removeComment: (commentId) =>
      setComments((current) => removeComment(current, commentId)),
  }

  return (
    <CommentsStateContext.Provider value={state}>
      <CommentsServicesContext.Provider value={services}>
        {children}
      </CommentsServicesContext.Provider>
    </CommentsStateContext.Provider>
  )
}

export const useCommentsState = () => {
  const context = useContext(CommentsStateContext)
  if (!context) {
    throw new Error('useCommentsState must be used within CommentsProvider')
  }
  return context
}

export const useCommentsServices = () => {
  const context = useContext(CommentsServicesContext)
  if (!context) {
    throw new Error('useCommentsServices must be used within CommentsProvider')
  }
  return context
}
