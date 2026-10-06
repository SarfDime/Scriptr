import { ScriptSaveButton } from '@/components/academics/scripts/actions/ScriptSaveButton'
import { ScriptVoteButton } from '@/components/academics/scripts/actions/ScriptVoteButton'
import { Box } from '@/components/common/Box'

export type ScriptEngagementActionsProps = {
  scriptId: string
  hasVoted: boolean
  voteScore: number
  isSaved: boolean
}

/** Upvote and save, side by side and sharing the row. */
export function ScriptEngagementActions({
  scriptId,
  hasVoted,
  voteScore,
  isSaved,
}: ScriptEngagementActionsProps) {
  return (
    <Box className='ui-cluster items-center gap-2'>
      <ScriptVoteButton
        scriptId={scriptId}
        initialVoted={hasVoted}
        initialScore={voteScore}
        className='grow'
      />
      <ScriptSaveButton
        scriptId={scriptId}
        initialSaved={isSaved}
        className='grow'
      />
    </Box>
  )
}
