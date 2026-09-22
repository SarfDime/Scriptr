'use client'

import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { useProtectedAction } from '@/hooks/useProtectedAction'
import { castVote } from '@/lib/api/votes-api'
import { cn } from '@/lib/common-utils'

export type ScriptVoteButtonProps = {
  scriptId: string
  /** Server-fetched via GET apiRoutes.votes.scriptMyVoteByScriptId — pass down rather than re-fetching client-side on mount. */
  initialVoted: boolean
  /** Server-fetched via GET apiRoutes.votes.scriptStatsByScriptId. */
  initialScore: number
  className?: string
}

/**
 * Toggles the caller's vote via a single atomic POST to
 * apiRoutes.votes.byScriptId (backed server-side by the toggle_vote RPC —
 * never called directly from the client). Casting is restriction-checked;
 * removing an existing vote is not, so a restricted response can only ever
 * occur on the add direction.
 */
export function ScriptVoteButton({
  scriptId,
  initialVoted,
  initialScore,
  className,
}: ScriptVoteButtonProps) {
  const [voted, setVoted] = useState(initialVoted)
  const [score, setScore] = useState(initialScore)
  const { state, run } = useProtectedAction(castVote)

  const handleClick = async () => {
    const result = await run(scriptId)
    if (result.ok) {
      setVoted(result.data.voted)
      setScore(result.data.vote_score)
    }
  }

  return (
    <div className={cn('ui-cluster gap-2 items-center', className)}>
      <Button
        onClick={handleClick}
        disabled={state.status === 'pending'}
        aria-pressed={voted}
        aria-label={voted ? 'Remove upvote' : 'Upvote this script'}
        className={cn('button', voted ? 'outline' : 'ghost')}
      >
        Upvote
      </Button>
      <Text className='ui-stat'>{score}</Text>
      {(state.status === 'restricted' || state.status === 'error') && (
        <Text className='ui-caption text-danger-600'>{state.message}</Text>
      )}
    </div>
  )
}
