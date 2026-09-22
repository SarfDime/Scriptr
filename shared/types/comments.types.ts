import type { REACTION_TYPES } from '@shared/config/shared-constants'
import type { Tables } from './database.types'
import type { PortableTextValue } from './portable-text.types'

/** The columns `PUBLIC_COMMENT_COLUMNS` selects — every list/detail/create
 * endpoint's non-relational fields. Excludes `is_flagged` (internal
 * moderation state, never public). */
export type CommentColumns = {
  id: string
  author_id: string
  content: PortableTextValue
  created_at: string
  edited: boolean
  parent_id: string | null
  professor_id: string | null
  script_id: string | null
  updated_at: string
}

/** Matches `author:profiles(username, full_name)`. */
export type CommentAuthorSummary = {
  username: string | null
  full_name: string | null
}

/** Matches `professor:professors(name)`. */
export type CommentProfessorSummary = {
  name: string
}

/** Matches `script:scripts(title)`. */
export type CommentScriptTitleSummary = {
  title: PortableTextValue
}

/** The five fields `attachEngagement()` appends to every comment row it
 * processes: reaction/like counts plus the current viewer's own status. */
export type CommentEngagement = {
  reactions_count: number
  reactions_by_type: Record<string, number>
  likes_count: number
  my_reaction: string | null
  liked_by_me: boolean
}

/** Matches `COMMENT_WITH_AUTHOR_AND_PROFESSOR_SELECT` — the raw select
 * result for `GET /script/:scriptId` and `PATCH /:id`, before
 * `attachEngagement()` runs. */
export type CommentWithAuthorAndProfessor = CommentColumns & {
  author: CommentAuthorSummary | null
  professor: CommentProfessorSummary | null
}

/** Matches `GET /professor/:professorId`'s select (author only — the
 * professor is already known from the URL), before `attachEngagement()`. */
export type CommentWithAuthorOnly = CommentColumns & {
  author: CommentAuthorSummary | null
}

/** Matches `GET /user/:userId`'s select (professor only — the author is
 * already known from the URL), before `attachEngagement()`. */
export type CommentWithProfessorOnly = CommentColumns & {
  professor: CommentProfessorSummary | null
}

/** Matches `COMMENT_CREATE_SELECT` — the raw select result for `POST /`
 * and `POST /:commentId/replies`. A created comment always carries both a
 * `professor`/`script` join since the route doesn't yet know which one is
 * populated; exactly one of `professor_id`/`script_id` is non-null per the
 * route's own validation. Engagement is zeroed manually here (a brand-new
 * comment has none) rather than via `attachEngagement()`. */
export type CommentWithAuthorProfessorScript = CommentColumns & {
  author: CommentAuthorSummary | null
  professor: CommentProfessorSummary | null
  script: CommentScriptTitleSummary | null
}

/** Matches `COMMENT_REACTION_WITH_USER_SELECT` — `GET /:commentId/reactions`
 * (array) and `POST /:commentId/reactions` (single, via upsert). */
export type CommentReactionWithUser = Tables<'comment_reactions'> & {
  user: { username: string | null } | null
}

/** `GET /flagged/all`'s shape (admin only): the standard comment columns
 * plus author and every flag against it, each with its reporter's
 * username. No `attachEngagement()` — flagged listings don't need it. */
export type CommentFlaggedSummary = CommentColumns & {
  author: CommentAuthorSummary | null
  flags: Array<
    Tables<'flags'> & { reporter: { username: string | null } | null }
  >
}

// -----------------------------------------------------------------------------
// Response shapes (post-`attachEngagement()` — what the client receives)
// -----------------------------------------------------------------------------

/** `GET /script/:scriptId`'s response shape (`Array<CommentSummary>`
 * directly), and `PATCH /:id`'s `{ success, comment }` shape. */
export type CommentSummary = CommentWithAuthorAndProfessor & CommentEngagement

/** `GET /professor/:professorId`'s response shape — `Array<CommentByProfessor>` directly. */
export type CommentByProfessor = CommentWithAuthorOnly & CommentEngagement

/** `GET /user/:userId`'s response shape — `Array<CommentByUser>` directly. */
export type CommentByUser = CommentWithProfessorOnly & CommentEngagement

/** `POST /`'s `{ success, comment }` shape and `POST /:commentId/replies`'s
 * `{ success, reply }` shape — identical, just wrapped under a different
 * key. */
export type CommentCreateResult = CommentWithAuthorProfessorScript &
  CommentEngagement

export type ReactionType = (typeof REACTION_TYPES)[number]
