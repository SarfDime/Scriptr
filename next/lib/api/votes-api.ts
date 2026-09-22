import { apiRoutes } from '@shared/config/api-routes'
import type {
  VoteRow,
  VoteStats,
  VoteToggleResponse,
} from '@shared/types/votes.types'
import { apiFetch } from './next-api'

/**
 * Public but never cached: vote counts shift on every cast/removal and a
 * stale score right after the caller's own vote would look like a bug.
 */
export const getScriptVoteStats = (scriptId: string) =>
  apiFetch<VoteStats>(apiRoutes.votes.scriptStatsByScriptId(scriptId), {
    cache: 'no-store',
  })

/** Session-scoped: never cached, requires the caller's cookie — same
 * pattern as getMyScripts. `null` when the caller hasn't voted on this
 * script (`GET /script/:scriptId/my-vote` uses `.maybeSingle()`). */
export const getMyScriptVote = (scriptId: string, cookie: string) =>
  apiFetch<VoteRow | null>(apiRoutes.votes.scriptMyVoteByScriptId(scriptId), {
    headers: { cookie },
    cache: 'no-store',
  })

export const castVote = async (scriptId: string) => {
  return apiFetch<VoteToggleResponse>(apiRoutes.votes.byScriptId(scriptId), {
    method: 'POST',
  })
}
