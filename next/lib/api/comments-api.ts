import type { ApiEndpoint } from '@shared/config/api-routes'
import { apiRoutes, withQuery } from '@shared/config/api-routes'
import { COMMENT_CACHE_TAGS } from '@shared/config/comments-cache-tags'
import {
  COMMENT_REPLIES_PAGE_SIZE,
  COMMENTS_PAGE_SIZE,
  type CommentSort,
} from '@shared/config/shared-constants'
import type {
  CommentCreateResult,
  CommentPage,
  CommentReactionToggleResponse,
  CommentReplySummary,
  CommentSummary,
  CommentWithReplyPreview,
  ReactionType,
} from '@shared/types/comments.types'
import type { PortableTextValue } from '@/lib/portable-text'
import { apiFetchRequired, cachedUnlessPersonalized } from './next-api'

const COMMENT_RESPONSE_CACHE_VERSION = 3

export type CommentTarget = { scriptId: string } | { professorId: string }

export type CommentPageOptions = {
  offset?: number
  sort?: CommentSort
}

function targetBody(target: CommentTarget) {
  return 'scriptId' in target
    ? { script_id: target.scriptId }
    : { professor_id: target.professorId }
}

async function getCommentPage<T>(
  path: ApiEndpoint,
  cookie: string | undefined,
  tags: Array<string>,
  options: CommentPageOptions = {}
): Promise<CommentPage<T>> {
  return apiFetchRequired<CommentPage<T>>(
    withQuery(path, {
      limit: COMMENTS_PAGE_SIZE,
      offset: options.offset ?? 0,
      sort: options.sort ?? 'newest',
      commentResponseVersion: COMMENT_RESPONSE_CACHE_VERSION,
    }),
    typeof window === 'undefined'
      ? cachedUnlessPersonalized(cookie, tags)
      : { cache: 'no-store' }
  )
}

/** Shared/cached by default. Pass `cookie` so `my_reactions`/`liked_by_me`
 * reflect the requesting user, not whoever's request happened to populate
 * the cache first — attachEngagement() reads the session user server-side
 * to compute those two fields. */
export const getScriptComments = (
  scriptId: string,
  cookie?: string,
  options?: CommentPageOptions
) =>
  getCommentPage<CommentWithReplyPreview>(
    apiRoutes.comments.scriptByScriptId(scriptId),
    cookie,
    [COMMENT_CACHE_TAGS.script(scriptId)],
    options
  )

export const getProfessorComments = (
  professorId: string,
  cookie?: string,
  options?: CommentPageOptions
) =>
  getCommentPage<CommentWithReplyPreview>(
    apiRoutes.comments.professorByProfessorId(professorId),
    cookie,
    [COMMENT_CACHE_TAGS.professor(professorId)],
    options
  )

export const getUserComments = (
  userId: string,
  cookie?: string,
  options?: CommentPageOptions
) =>
  getCommentPage<CommentWithReplyPreview>(
    apiRoutes.comments.userByUserId(userId),
    cookie,
    [COMMENT_CACHE_TAGS.user(userId)],
    options
  )

export const getTargetComments = (
  target: CommentTarget,
  options: CommentPageOptions = {}
): Promise<CommentPage<CommentWithReplyPreview>> =>
  'scriptId' in target
    ? getScriptComments(target.scriptId, undefined, options)
    : getProfessorComments(target.professorId, undefined, options)

export const getCommentReplies = (
  commentId: string,
  offset = 0
): Promise<CommentPage<CommentReplySummary>> =>
  apiFetchRequired<CommentPage<CommentReplySummary>>(
    withQuery(apiRoutes.comments.repliesByCommentId(commentId), {
      limit: COMMENT_REPLIES_PAGE_SIZE,
      offset,
    }),
    { cache: 'no-store' }
  )

/** `POST /` (hono/src/routes/comments.ts) wraps its `CommentCreateResult`
 * as `{ success, comment }`. Restriction-checked (is_restricted()), so callers
 * should run this through useProtectedAction. */
export const postComment = (
  target: CommentTarget,
  content: PortableTextValue
) =>
  apiFetchRequired<{ success: true; comment: CommentCreateResult }>(
    apiRoutes.comments.index,
    {
      method: 'POST',
      body: { content, ...targetBody(target) },
    }
  )

export const patchComment = (commentId: string, content: PortableTextValue) =>
  apiFetchRequired<{ success: true; comment: CommentSummary }>(
    apiRoutes.comments.byId(commentId),
    {
      method: 'PATCH',
      body: { content },
    }
  )

/** `POST /:commentId/replies` wraps as `{ success, reply }`. */
export const postReply = (commentId: string, content: PortableTextValue) =>
  apiFetchRequired<{ success: true; reply: CommentCreateResult }>(
    apiRoutes.comments.repliesByCommentId(commentId),
    {
      method: 'POST',
      body: { content },
    }
  )

/** `POST /:commentId/reactions` toggles one reaction type for the caller. */
export const postReaction = (commentId: string, reactionType: ReactionType) =>
  apiFetchRequired<CommentReactionToggleResponse>(
    apiRoutes.comments.reactionsByCommentId(commentId),
    {
      method: 'POST',
      body: { reaction_type: reactionType },
    }
  )

export const deleteComment = (commentId: string) =>
  apiFetchRequired<{
    success: true
    message: string
    totalCommentCount: number
  }>(apiRoutes.comments.byId(commentId), { method: 'DELETE' })

/** `POST /:commentId/like` wraps as `{ success, liked }`. */
export const toggleLike = (commentId: string) =>
  apiFetchRequired<{ success: true; liked: boolean }>(
    apiRoutes.comments.likeByCommentId(commentId),
    { method: 'POST' }
  )
