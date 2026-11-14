'use client'

import { VoteButton } from '@/components/ui/VoteButton'
import { castVote } from '@/lib/api/votes-api'
import { useUIStrings } from '@/providers/locale/use-strings'

export type ScriptVoteButtonProps = {
  scriptId: string
  /** Server-fetched via GET apiRoutes.votes.scriptMyVoteByScriptId — pass down rather than re-fetching client-side on mount. */
  initialVoted: boolean
  /** Server-fetched via GET apiRoutes.votes.scriptStatsByScriptId. */
  initialScore: number
  disabled?: boolean
  className?: string
}

/**
 * Script upvote: `VoteButton` bound to a single atomic POST to
 * apiRoutes.votes.byScriptId (backed server-side by the toggle_vote RPC —
 * never called directly from the client). Casting is restriction-checked;
 * removing an existing vote is not, so a restricted response can only ever
 * occur on the add direction. This wrapper exists because Server Components
 * (the script detail page) can't pass the `action` function across the
 * server/client boundary.
 */
export function ScriptVoteButton({
  scriptId,
  initialVoted,
  initialScore,
  disabled,
  className,
}: ScriptVoteButtonProps) {
  const ui = useUIStrings()

  return (
    <VoteButton
      initialVoted={initialVoted}
      initialCount={initialScore}
      action={async () => {
        const result = await castVote(scriptId)
        return { voted: result.voted, count: result.vote_score }
      }}
      label={ui.scripts.actions.upvote}
      noun={ui.scripts.actions.voteNoun}
      disabled={disabled}
      className={className}
    />
  )
}
