import type { Tables } from '@shared/types/database.types'

// -----------------------------------------------------------------------------
// API Response Shapes (hono/src/routes/votes.ts)
// -----------------------------------------------------------------------------

/** Matches GET /script/:scriptId/stats' bare `{ upvotes, score }` response. */
export type ScriptVoteStats = {
  upvotes: number
  score: number
}

/**
 * Matches GET /script/:scriptId/my-vote's response: `.select('*')` on
 * `votes` via `.maybeSingle()` — the raw row (`Tables<'votes'>`) if the
 * user has voted, or `null` if they haven't. **Not** `{ voted: boolean }` —
 * that shape belongs to the POST /:scriptId toggle-vote response instead
 * (a different endpoint, not exposed by votes-api.ts).
 */
export type MyScriptVote = Tables<'votes'> | null
