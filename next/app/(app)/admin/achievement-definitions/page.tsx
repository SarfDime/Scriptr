import { AchievementDefinitionsPanel } from '@/components/admin/AchievementDefinitionsPanel'
import { AdminAccessGate } from '@/components/admin/AdminAccessGate'
import { AdminPageLayout } from '@/components/admin/AdminPageLayout'
import { loadAdminAchievementDefinitionsPage } from '@/lib/admin-achievement-definitions-page'
import { requireAdminUnlock } from '@/lib/admin-page-guard'

export default async function AdminAchievementDefinitionsPage() {
  const cookie = await requireAdminUnlock()
  if (!cookie) return <AdminAccessGate />

  const initialData = await loadAdminAchievementDefinitionsPage(cookie)
  return (
    <AdminPageLayout section='achievement-definitions'>
      <AchievementDefinitionsPanel initialData={initialData} />
    </AdminPageLayout>
  )
}
