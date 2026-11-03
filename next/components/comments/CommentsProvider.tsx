'use client'

import type { CommentSort } from '@shared/config/shared-constants'
import { COMMENT_STRINGS } from '@shared/strings/comments-strings'
import type { CommentPage } from '@shared/types/comments.types'
import { createContext, useContext, useState } from 'react'
import * as defaultCommentsApi from '@/lib/api/comments-api'
import { countComments, removeComment } from '@/lib/comments/comment-tree'
import { useSession } from '@/providers/SessionProvider'
import type { CommentEntity } from '@/types/components/comments/Comments.types'
import type {
  CommentsProviderProps,
  CommentsServicesValue,
  CommentsStateValue,
} from '@/types/components/comments/CommentThread.types'

type CachedCommentPage = CommentPage<CommentEntity> & {
  serverLoadedCount: number
}

function prepareComments(comments: Array<CommentEntity>) {
  return comments.map((comment) => ({
    ...comment,
    initial_replies_count: comment.replies?.length ?? 0,
    replies: (comment.replies ?? []).map((reply) => ({
      ...reply,
      initial_replies_count: reply.replies?.length ?? 0,
      replies: [],
      replies_has_more: reply.replies_has_more ?? reply.has_replies,
      replies_loaded: true,
      replies_loaded_count: 0,
    })),
    replies_loaded: true,
    replies_loaded_count: comment.replies?.length ?? 0,
  }))
}

function appendUniqueComments(
  existing: Array<CommentEntity>,
  incoming: Array<CommentEntity>
) {
  const existingIds = new Set(existing.map((comment) => comment.id))
  return [
    ...existing,
    ...incoming.filter((comment) => !existingIds.has(comment.id)),
  ]
}

function updateCommentTree(
  comments: Array<CommentEntity>,
  commentId: string,
  update: (comment: CommentEntity) => CommentEntity
): Array<CommentEntity> {
  return comments.map((comment) =>
    comment.id === commentId
      ? update(comment)
      : {
          ...comment,
          replies: comment.replies
            ? updateCommentTree(comment.replies, commentId, update)
            : undefined,
        }
  )
}

function appendReplyPage(
  comments: Array<CommentEntity>,
  commentId: string,
  replyPage: Array<CommentEntity>,
  hasMore: boolean
): Array<CommentEntity> {
  return updateCommentTree(comments, commentId, (comment) => {
    const repliesById = new Map<string, CommentEntity>(
      (comment.replies ?? []).map((reply) => [reply.id, reply])
    )
    for (const reply of replyPage) {
      const existingReply = repliesById.get(reply.id)
      repliesById.set(reply.id, {
        ...reply,
        initial_replies_count: existingReply?.initial_replies_count ?? 0,
        replies: existingReply?.replies ?? [],
        replies_has_more: existingReply?.replies_has_more ?? reply.has_replies,
        replies_loaded: existingReply?.replies_loaded ?? true,
        replies_loaded_count: existingReply?.replies_loaded_count ?? 0,
      })
    }

    return {
      ...comment,
      replies: Array.from(repliesById.values()).sort(
        (left, right) =>
          new Date(left.created_at).getTime() -
            new Date(right.created_at).getTime() ||
          left.id.localeCompare(right.id)
      ),
      replies_has_more: hasMore,
      replies_loaded: true,
      replies_loaded_count:
        (comment.replies_loaded_count ?? comment.replies?.length ?? 0) +
        replyPage.length,
    }
  })
}

function emptyPage(): CachedCommentPage {
  return {
    items: [],
    hasMore: false,
    totalCount: 0,
    totalCommentCount: 0,
    serverLoadedCount: 0,
  }
}

// Two contexts so readers of the tree (header count, list) and writers
// (composer, reply box, action buttons) each depend only on what they use.
const CommentsStateContext = createContext<CommentsStateValue | null>(null)
const CommentsServicesContext = createContext<CommentsServicesValue | null>(
  null
)

/**
 * Keeps fetched root and reply pages in local state. This means expanding a
 * loaded thread or switching back to an already-fetched sort does not refetch.
 */
export function CommentsProvider({
  target,
  initialComments,
  api = defaultCommentsApi,
  children,
}: CommentsProviderProps) {
  const initialPage: CachedCommentPage = {
    ...initialComments,
    items: prepareComments(initialComments.items),
    serverLoadedCount: initialComments.items.length,
  }
  const [previousInitialComments, setPreviousInitialComments] =
    useState(initialComments)
  const [pages, setPages] = useState<
    Partial<Record<CommentSort, CachedCommentPage>>
  >(() => ({ newest: initialPage }))
  if (initialComments !== previousInitialComments) {
    setPreviousInitialComments(initialComments)
    setPages((current) => ({ ...current, newest: initialPage }))
  }
  const [sort, setSort] = useState<CommentSort>('newest')
  const [loadingSorts, setLoadingSorts] = useState<ReadonlySet<CommentSort>>(
    () => new Set()
  )
  const [sortErrors, setSortErrors] = useState<
    Partial<Record<CommentSort, string>>
  >({})
  const [loadingReplyIds, setLoadingReplyIds] = useState<ReadonlySet<string>>(
    () => new Set()
  )
  const [replyErrors, setReplyErrors] = useState<Record<string, string>>({})
  const currentPage = pages[sort] ?? emptyPage()

  const { session } = useSession()

  const loadMoreComments = async () => {
    const page = pages[sort]
    if (!page?.hasMore || loadingSorts.has(sort)) return
    setLoadingSorts((current) => new Set(current).add(sort))
    setSortErrors((current) => ({ ...current, [sort]: undefined }))
    try {
      const result = await api.getTargetComments(target, {
        offset: page.serverLoadedCount,
        sort,
      })
      setPages((current) => ({
        ...current,
        [sort]: {
          ...result,
          serverLoadedCount:
            (current[sort]?.serverLoadedCount ?? 0) + result.items.length,
          items: appendUniqueComments(
            current[sort]?.items ?? [],
            prepareComments(result.items)
          ),
        },
      }))
    } catch {
      setSortErrors((current) => ({
        ...current,
        [sort]: COMMENT_STRINGS.general.loadMoreCommentsError,
      }))
    } finally {
      setLoadingSorts((current) => {
        const next = new Set(current)
        next.delete(sort)
        return next
      })
    }
  }

  const changeSort = async (nextSort: CommentSort) => {
    setSort(nextSort)
    if (pages[nextSort] || loadingSorts.has(nextSort)) return

    setLoadingSorts((current) => new Set(current).add(nextSort))
    setSortErrors((current) => ({ ...current, [nextSort]: undefined }))
    try {
      const result = await api.getTargetComments(target, {
        offset: 0,
        sort: nextSort,
      })
      setPages((current) => ({
        ...current,
        [nextSort]: {
          ...result,
          items: prepareComments(result.items),
          serverLoadedCount: result.items.length,
        },
      }))
    } catch {
      setSortErrors((current) => ({
        ...current,
        [nextSort]: COMMENT_STRINGS.general.loadCommentsError,
      }))
    } finally {
      setLoadingSorts((current) => {
        const next = new Set(current)
        next.delete(nextSort)
        return next
      })
    }
  }

  const loadMoreReplies = async (commentId: string) => {
    if (loadingReplyIds.has(commentId)) return
    const comments = pages[sort]?.items ?? []
    const parent = findComment(comments, commentId)
    if (!parent) return
    setLoadingReplyIds((current) => new Set(current).add(commentId))
    setReplyErrors((current) => {
      const next = { ...current }
      delete next[commentId]
      return next
    })
    try {
      const result = await api.getCommentReplies(
        commentId,
        parent.replies_loaded_count ?? parent.replies?.length ?? 0
      )
      setPages((current) => {
        const next = { ...current }
        for (const [pageSort, page] of Object.entries(current)) {
          if (!page) continue
          next[pageSort as CommentSort] = {
            ...page,
            items: appendReplyPage(
              page.items,
              commentId,
              result.items,
              result.hasMore
            ),
          }
        }
        return next
      })
    } catch {
      setReplyErrors((current) => ({
        ...current,
        [commentId]: COMMENT_STRINGS.general.loadRepliesError,
      }))
    } finally {
      setLoadingReplyIds((current) => {
        const next = new Set(current)
        next.delete(commentId)
        return next
      })
    }
  }

  const loadMoreThreadReplies = async (commentId: string) => {
    const root = findComment(pages[sort]?.items ?? [], commentId)
    if (!root) return

    const pendingIds: Array<string> = []
    const collectPendingReplies = (comment: CommentEntity) => {
      if (comment.replies_has_more) pendingIds.push(comment.id)
      for (const reply of comment.replies ?? []) {
        collectPendingReplies(reply)
      }
    }
    collectPendingReplies(root)

    for (const pendingId of pendingIds) {
      await loadMoreReplies(pendingId)
    }
  }

  const state: CommentsStateValue = {
    comments: currentPage.items,
    commentCount: currentPage.totalCommentCount ?? currentPage.totalCount,
    sort,
    hasMoreComments: currentPage.hasMore,
    isLoadingComments: loadingSorts.has(sort),
    commentsError: sortErrors[sort],
    loadingReplyIds,
    replyErrors,
    setSort: changeSort,
    loadMoreComments,
    loadMoreReplies,
    loadMoreThreadReplies,
  }

  const services: CommentsServicesValue = {
    target,
    api,
    currentUserId:
      session.status === 'authenticated' ? session.user.id : undefined,
    currentUserRole:
      session.status === 'authenticated' ? session.user.role : undefined,
    addComment: (comment) =>
      setPages((current) => {
        const page = current[sort]
        if (!page) return current
        return {
          ...current,
          [sort]: {
            ...page,
            items: [comment, ...page.items],
            totalCount: page.totalCount + 1,
            totalCommentCount: (page.totalCommentCount ?? page.totalCount) + 1,
            serverLoadedCount:
              page.serverLoadedCount + (sort === 'newest' ? 1 : 0),
          },
        }
      }),
    addReply: (parentId, reply) =>
      setPages((current) => {
        const next = { ...current }
        for (const [pageSort, page] of Object.entries(current)) {
          if (!page) continue
          const parent = findComment(page.items, parentId)
          next[pageSort as CommentSort] = {
            ...page,
            totalCommentCount: parent
              ? (page.totalCommentCount ?? page.totalCount) + 1
              : page.totalCommentCount,
            items: updateCommentTree(page.items, parentId, (parent) => ({
              ...parent,
              replies: [...(parent.replies ?? []), reply],
              replies_loaded_count:
                (parent.replies_loaded_count ?? parent.replies?.length ?? 0) +
                1,
            })),
          }
        }
        return next
      }),
    updateComment: (comment) =>
      setPages((current) => {
        const next = { ...current }
        for (const [pageSort, page] of Object.entries(current)) {
          if (!page) continue
          next[pageSort as CommentSort] = {
            ...page,
            items: updateCommentTree(page.items, comment.id, (existing) => ({
              ...comment,
              replies: existing.replies,
            })),
          }
        }
        return next
      }),
    removeComment: (commentId, totalCommentCount) =>
      setPages((current) => {
        const next = { ...current }
        for (const [pageSort, page] of Object.entries(current)) {
          if (!page) continue
          const removed = findComment(page.items, commentId)
          const isRoot = page.items.some((comment) => comment.id === commentId)
          next[pageSort as CommentSort] = {
            ...page,
            items: removeComment(page.items, commentId),
            totalCount: isRoot
              ? Math.max(0, page.totalCount - 1)
              : page.totalCount,
            totalCommentCount:
              totalCommentCount ??
              (removed
                ? Math.max(
                    0,
                    (page.totalCommentCount ?? page.totalCount) -
                      1 -
                      countComments(removed.replies ?? [])
                  )
                : page.totalCommentCount),
            serverLoadedCount: isRoot
              ? Math.max(0, page.serverLoadedCount - 1)
              : page.serverLoadedCount,
          }
        }
        return next
      }),
  }

  return (
    <CommentsStateContext.Provider value={state}>
      <CommentsServicesContext.Provider value={services}>
        {children}
      </CommentsServicesContext.Provider>
    </CommentsStateContext.Provider>
  )
}

function findComment(
  comments: Array<CommentEntity>,
  commentId: string
): CommentEntity | undefined {
  for (const comment of comments) {
    if (comment.id === commentId) return comment
    const nested = comment.replies
      ? findComment(comment.replies, commentId)
      : undefined
    if (nested) return nested
  }
  return undefined
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
