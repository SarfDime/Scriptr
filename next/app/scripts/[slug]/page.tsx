import { ScriptDescription } from '@/components/academics/scripts/detail/ScriptDescription'
import { ScriptDetailOverview } from '@/components/academics/scripts/detail/ScriptDetailOverview'
import { CommentSection } from '@/components/comments/CommentSection'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageLayout } from '@/components/layout/PageLayout'
import { Divider } from '@/components/ui/Divider'
import { loadScriptDetailPage } from '@/lib/script-detail-page'

export default async function ScriptDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug: scriptId } = await params
  const { detail, comments, commentsUnavailable } =
    await loadScriptDetailPage(scriptId)

  return (
    <PageLayout>
      <PageHeader title={detail.script.title} />
      <ScriptDetailOverview detail={detail} />
      <ScriptDescription description={detail.script.description} />
      <Divider />
      <CommentSection
        target={{ scriptId }}
        initialComments={comments}
        initialLoadFailed={commentsUnavailable}
      />
    </PageLayout>
  )
}
