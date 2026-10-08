import { apiRoutes } from '@shared/config/api-routes'
import type {
  VoteRow,
  VoteStats,
  VoteToggleResponse,
} from '@shared/types/votes.types'
import { apiFetchRequired } from './next-api'

/**
 * Public but never cached: vote counts shift on every cast/removal and a
 * stale score right after the caller's own vote would look like a bug.
 */
export const getScriptVoteStats = (scriptId: string) =>
  apiFetchRequired<VoteStats>(apiRoutes.votes.scriptStatsByScriptId(scriptId), {
    cache: 'no-store',
  })

/** Session-scoped: never cached. Server callers forward their cookie, while
 * client callers use apiFetch's included browser credentials. `null` when
 * the caller hasn't voted on a script (`GET /script/:scriptId/my-vote`
 * uses `.maybeSingle()`). */
export const getMyScriptVote = (scriptId: string, cookie?: string) =>
  apiFetchRequired<VoteRow | null>(
    apiRoutes.votes.scriptMyVoteByScriptId(scriptId),
    {
      ...(cookie && { headers: { cookie } }),
      cache: 'no-store',
    }
  )

export const castVote = async (scriptId: string) => {
  return apiFetchRequired<VoteToggleResponse>(
    apiRoutes.votes.byScriptId(scriptId),
    {
      method: 'POST',
    }
  )
}
