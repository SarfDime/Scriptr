import type { ScriptSummary } from '@shared/types/scripts.types'
import { CommentSection } from '@/components/comments/CommentSection'
import { Divider } from '@/components/ui/Divider'
import { loadScriptDetailPage } from '@/lib/script-detail-page'
import { ScriptDescription } from './ScriptDescription'
import { ScriptDetailOverview } from './ScriptDetailOverview'

export type ScriptDetailBodyProps = {
  scriptId: string
  /** Already loaded by the page, which needs it for the title (and 404s
   * before anything renders). */
  script: ScriptSummary
}

/**
 * Everything below the script title. It is a separate Server Component so the
 * page can stream it inside a Suspense boundary while the route's existence
 * check completes first — the 404 status depends on that ordering.
 */
export async function ScriptDetailBody({
  scriptId,
  script,
}: ScriptDetailBodyProps) {
  const { detail, comments, commentsUnavailable } = await loadScriptDetailPage(
    scriptId,
    script
  )

  return (
    <>
      <ScriptDetailOverview detail={detail} />
      <ScriptDescription description={detail.script.description} />
      <Divider />
      <CommentSection
        target={{ scriptId }}
        initialComments={comments}
        initialLoadFailed={commentsUnavailable}
        studyId={script.study_id}
      />
    </>
  )
}
