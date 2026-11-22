import { Suspense } from 'react'
import { AchievementDefinitionsPanel } from '@/components/admin/AchievementDefinitionsPanel'
import { AdminAccessGate } from '@/components/admin/AdminAccessGate'
import { AdminPageLayout } from '@/components/admin/AdminPageLayout'
import { AdminPageSkeleton } from '@/components/admin/AdminPageSkeleton'
import { loadAdminAchievementDefinitionsPage } from '@/lib/admin-achievement-definitions-page'
import { requireAdminUnlock } from '@/lib/admin-page-guard'

/** Anonymous validation hits the gate's 404, so this page has no instant UI to assert. */
export const instant = false

export default function AdminAchievementDefinitionsPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminAchievementDefinitionsContent />
    </Suspense>
  )
}

async function AdminAchievementDefinitionsContent() {
  const cookie = await requireAdminUnlock()
  if (!cookie) return <AdminAccessGate />

  const initialData = await loadAdminAchievementDefinitionsPage(cookie)
  return (
    <AdminPageLayout section='achievement-definitions'>
      <AchievementDefinitionsPanel initialData={initialData} />
    </AdminPageLayout>
  )
}
