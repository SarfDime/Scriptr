import type { PortableTextValue } from '@shared/types/portable-text.types'
import type { ScriptSummary } from '@shared/types/scripts.types'
import { Suspense } from 'react'
import { ScriptDetailBody } from '@/components/academics/scripts/detail/ScriptDetailBody'
import { ScriptDetailSkeleton } from '@/components/academics/scripts/detail/ScriptDetailSkeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageLayout } from '@/components/layout/PageLayout'

/**
 * One script's page, shared by the catalog URL and the study site. The
 * existence check has already run by the time this renders (so a missing script
 * answers a real `404` — see `ScriptDetailSkeleton` on why the route has no
 * `loading.tsx`), and the rest of the screen streams behind a Suspense boundary
 * with the same skeleton that used to be the route's loading file.
 */
export const ScriptDetailView = ({
  script,
  /** The title in the reader's language: resolved by the route, which knows it. */
  title,
}: {
  script: ScriptSummary
  title: PortableTextValue
}) => (
  <PageLayout>
    <PageHeader title={title} />
    <Suspense fallback={<ScriptDetailSkeleton />}>
      <ScriptDetailBody scriptId={script.id} script={script} />
    </Suspense>
  </PageLayout>
)
