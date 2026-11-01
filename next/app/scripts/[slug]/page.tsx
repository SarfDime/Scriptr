import { Suspense } from 'react'
import { ScriptDetailBody } from '@/components/academics/scripts/detail/ScriptDetailBody'
import { ScriptDetailSkeleton } from '@/components/academics/scripts/detail/ScriptDetailSkeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageLayout } from '@/components/layout/PageLayout'
import { loadScriptDetailScript } from '@/lib/script-detail-page'

/**
 * The script page. The existence check runs first (so a missing script answers
 * a real `404` — see `ScriptDetailSkeleton` on why the route has no
 * `loading.tsx`), then the rest of the screen streams behind a Suspense
 * boundary with the same skeleton that used to be the route's loading file.
 */
export default async function ScriptDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug: scriptId } = await params
  const script = await loadScriptDetailScript(scriptId)

  return (
    <PageLayout>
      <PageHeader title={script.title} />
      <Suspense fallback={<ScriptDetailSkeleton />}>
        <ScriptDetailBody scriptId={scriptId} script={script} />
      </Suspense>
    </PageLayout>
  )
}
