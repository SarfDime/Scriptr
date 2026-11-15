import { SCRIPT_STRINGS_PACK } from '@shared/strings/scripts-strings'
import { ScriptManageActions } from '@/components/academics/scripts/manage/ScriptManageActions'
import { ScriptPanel } from '@/components/academics/scripts/ScriptPanel'
import { Divider } from '@/components/ui/Divider'
import { getServerStrings } from '@/lib/server-strings'
import type { ScriptDetailViewModel } from '@/types/components/ScriptDetail.types'
import { ScriptAuthorCard } from './ScriptAuthorCard'
import { ScriptEngagementActions } from './ScriptEngagementActions'
import { ScriptInfoFooter } from './ScriptInfoFooter'
import { ScriptMetaList } from './ScriptMetaList'

/** The script's identity and metadata: who uploaded it, vote/save, details,
 * and last-updated/report. Shares its row with the additional reading panel
 * and stretches to the same height. */
export async function ScriptInfoPanel({
  detail,
}: {
  detail: ScriptDetailViewModel
}) {
  const strings = await getServerStrings(SCRIPT_STRINGS_PACK)
  const {
    scriptId,
    script,
    localizedTitle,
    localizedDescription,
    voteScore,
    hasVoted,
    isSaved,
    isAuthor,
    canManage,
    viewerDataFailed,
    subjectHref,
    subjectName,
  } = detail

  return (
    <ScriptPanel
      aria-label={strings.info.ariaLabel}
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
      <ScriptMetaList
        script={script}
        subjectHref={subjectHref}
        subjectName={subjectName}
      />
      {canManage && (
        <ScriptManageActions
          scriptId={scriptId}
          subjectId={script.subject_id}
          script={{
            title: localizedTitle,
            description: localizedDescription,
            additional_reading: script.additional_reading,
            exam_session: script.exam_session,
            exam_year: script.exam_year,
            slug: script.slug,
          }}
          subjectHref={subjectHref}
        />
      )}
      <ScriptInfoFooter
        scriptId={scriptId}
        isAuthor={isAuthor}
        updatedAt={script.updated_at}
      />
    </ScriptPanel>
  )
}
