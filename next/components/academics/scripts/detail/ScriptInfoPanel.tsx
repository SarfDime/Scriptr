import { SCRIPT_STRINGS } from '@shared/strings/scripts-strings'
import { ScriptPanel } from '@/components/academics/scripts/ScriptPanel'
import { Divider } from '@/components/ui/Divider'
import type { ScriptDetailViewModel } from '@/types/components/ScriptDetail.types'
import { ScriptAuthorCard } from './ScriptAuthorCard'
import { ScriptEngagementActions } from './ScriptEngagementActions'
import { ScriptInfoFooter } from './ScriptInfoFooter'
import { ScriptMetaList } from './ScriptMetaList'

/** The script's identity and metadata: who uploaded it, vote/save, details,
 * and last-updated/report. Shares its row with the additional reading panel
 * and stretches to the same height. */
export function ScriptInfoPanel({ detail }: { detail: ScriptDetailViewModel }) {
  const {
    scriptId,
    script,
    voteScore,
    hasVoted,
    isSaved,
    isAuthor,
    viewerDataFailed,
    subjectHref,
  } = detail

  return (
    <ScriptPanel
      aria-label={SCRIPT_STRINGS.info.ariaLabel}
      className='min-w-0 grow basis-[16rem]'
    >
      <ScriptAuthorCard author={script.author} />
      <ScriptEngagementActions
        scriptId={scriptId}
        hasVoted={hasVoted}
        voteScore={voteScore}
        isSaved={isSaved}
        isAuthor={isAuthor}
        viewerDataFailed={viewerDataFailed}
      />
      <Divider />
      <ScriptMetaList script={script} subjectHref={subjectHref} />
      <ScriptInfoFooter
        scriptId={scriptId}
        isAuthor={isAuthor}
        updatedAt={script.updated_at}
      />
    </ScriptPanel>
  )
}
