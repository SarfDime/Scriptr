import type { Tables } from './database.types'
import type { LocalizedScriptText } from './scripts.types'

// -----------------------------------------------------------------------------
// API Response Shapes (hono/src/routes/votes.ts)
// -----------------------------------------------------------------------------
// Typed against the route's actual `.select(...)` calls, not guessed.
// `VOTE_WITH_SCRIPT_SELECT` (defined in votes.ts, matching `VoteWithScript`
// here) is one shared select string reused by `/user/:userId` and
// `/my-votes` — the two endpoints that select the identical
// `script:scripts(id, title, subject:subjects(name))` shape. `GET /` and
// `GET /script/:scriptId` each select a genuinely different shape (a
// title-only script join, and no script join at all, respectively) and are
// typed separately below rather than folded into one type.

/** Matches `user:profiles(username)`. */
export type VoteUserSummary = {
  username: string | null
}

/** Matches `script:scripts(title)` — used only by `GET /` (list all votes). */
export type VoteScriptTitleOnly = {
  title: LocalizedScriptText | null
}

/** Matches `script:scripts(id, title, subject:subjects(name))` — used by
 * `/user/:userId` and `/my-votes` via `VOTE_WITH_SCRIPT_SELECT`. */
export type VoteScriptSummary = {
  id: string
  title: LocalizedScriptText
  subject: { name: string } | null
}

/**
 * `GET /`'s shape: every vote across every script, with a user summary and
 * a script title (no subject nesting — see `VoteScriptTitleOnly`). Returns
 * `Array<VoteWithUserAndScript>` directly.
 */
export type VoteWithUserAndScript = Tables<'votes'> & {
  user: VoteUserSummary | null
  script: VoteScriptTitleOnly | null
}

/**
 * `GET /script/:scriptId`'s shape: every vote for one script, with a user
 * summary and no script join (the script is already known from the URL).
 * Returns `Array<VoteWithUser>` directly.
 */
export type VoteWithUser = Tables<'votes'> & {
  user: VoteUserSummary | null
}

/**
 * `GET /user/:userId` and `GET /my-votes`'s shape: every vote by one user,
 * via `VOTE_WITH_SCRIPT_SELECT` — no user join (the user is already known
 * from the URL/session). Returns `Array<VoteWithScript>` directly.
 */
export type VoteWithScript = Tables<'votes'> & {
  script: VoteScriptSummary | null
}

/**
 * `GET /script/:scriptId/my-vote`'s shape: the bare `votes` row for this
 * user/script pair, or `null` if they haven't voted (`.maybeSingle()`).
 */
export type VoteRow = Tables<'votes'>

/**
 * `POST /:scriptId`'s response shape — the `toggle_vote` RPC's row (already
 * strongly typed via `Database['public']['Functions']['toggle_vote']`,
 * needs no `overrideTypes`), reshaped into the route's actual JSON
 * response.
 */
export type VoteToggleResult = {
  voted: boolean
  vote_score: number
}

/** `GET /script/:scriptId/stats`'s shape — not a `votes` row selection,
 * just a count reshaped into this response. */
export type VoteStats = {
  upvotes: number
  score: number
}

export type VoteToggleResponse = { voted: boolean; vote_score: number }
