import { apiRoutes } from '@shared/config/api-routes'
import { COMMENT_CACHE_TAGS } from '@shared/config/comments-cache-tags'
import type {
  CommentByProfessor,
  CommentByUser,
  CommentCreateResult,
  CommentReactionWithUser,
  CommentSummary,
} from '@shared/types/comments.types'
import type { PortableTextValue } from '@/lib/portable-text'
import { apiFetch, cachedUnlessPersonalized } from './next-api'

export type CommentTarget = { scriptId: string } | { professorId: string }

function targetBody(target: CommentTarget) {
  return 'scriptId' in target
    ? { script_id: target.scriptId }
    : { professor_id: target.professorId }
}

/** Shared/cached by default. Pass `cookie` so `my_reaction`/`liked_by_me`
 * reflect the requesting user, not whoever's request happened to populate
 * the cache first — attachEngagement() reads the session user server-side
 * to compute those two fields. Forwarding a cookie forces `no-store` (see
 * cachedUnlessPersonalized) for the same cross-user leak reason as
 * scripts-api.ts. */
export const getScriptComments = (scriptId: string, cookie?: string) =>
  apiFetch<Array<CommentSummary>>(
    apiRoutes.comments.scriptByScriptId(scriptId),
    cachedUnlessPersonalized(cookie, [COMMENT_CACHE_TAGS.script(scriptId)])
  )

export const getProfessorComments = (professorId: string, cookie?: string) =>
  apiFetch<Array<CommentByProfessor>>(
    apiRoutes.comments.professorByProfessorId(professorId),
    cachedUnlessPersonalized(cookie, [
      COMMENT_CACHE_TAGS.professor(professorId),
    ])
  )

export const getUserComments = (userId: string, cookie?: string) =>
  apiFetch<Array<CommentByUser>>(
    apiRoutes.comments.userByUserId(userId),
    cachedUnlessPersonalized(cookie, [COMMENT_CACHE_TAGS.user(userId)])
  )

/** `POST /` (hono/src/routes/comments.ts) wraps its `CommentCreateResult`
 * as `{ success, comment }` — moved here from CommentSection.tsx, and
 * corrected from the bare `{ comment }` it was (unverifiedly) typed as
 * before. Restriction-checked (is_restricted()), so callers should run
 * this through useProtectedAction. */
export const postComment = (
  target: CommentTarget,
  content: PortableTextValue
) =>
  apiFetch<{ success: true; comment: CommentCreateResult }>(
    apiRoutes.comments.index,
    {
      method: 'POST',
      body: { content, ...targetBody(target) },
    }
  )

/** `POST /:commentId/replies` wraps as `{ success, reply }` — moved here
 * from CommentSection.tsx, and corrected from `{ comment }` (the actual
 * key is `reply`; CommentSection was reading `.comment` off this call's
 * result too, which would have been `undefined` at runtime). */
export const postReply = (commentId: string, content: PortableTextValue) =>
  apiFetch<{ success: true; reply: CommentCreateResult }>(
    apiRoutes.comments.repliesByCommentId(commentId),
    {
      method: 'POST',
      body: { content },
    }
  )

/** `POST /:commentId/reactions` wraps as `{ success, reaction }`. */
export const postReaction = (commentId: string, reactionType: string) =>
  apiFetch<{ success: true; reaction: CommentReactionWithUser }>(
    apiRoutes.comments.reactionsByCommentId(commentId),
    {
      method: 'POST',
      body: { reaction_type: reactionType },
    }
  )

/** `POST /:commentId/like` wraps as `{ success, liked }`. Not
 * restriction-checked (API_DOCUMENTATION.md) — call directly, no
 * useProtectedAction wrapper, matching favorites/vote-removal treatment. */
export const toggleLike = (commentId: string) =>
  apiFetch<{ success: true; liked: boolean }>(
    apiRoutes.comments.likeByCommentId(commentId),
    { method: 'POST' }
  )

/**
 * OPEN ITEM (backend, out of this file's scope): ARCHITECTURE.md §3 documents
 * scripts as tag-revalidating via a backend webhook after mutation. Comments
 * have no equivalent documented yet — without something firing
 * COMMENT_CACHE_TAGS.script/professor/user on comment/reply/reaction/like
 * mutations, an anonymous (no-cookie) cached read will keep serving the
 * pre-mutation list until the tag's default revalidation window passes.
 * CommentSection's local state already reflects new comments/reactions
 * optimistically for the acting user in that session, so this doesn't break
 * the immediate UX — it only affects other visitors' cached reads.
 */
