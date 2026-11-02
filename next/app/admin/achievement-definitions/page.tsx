import { cookies } from 'next/headers'
import { AchievementDefinitionsPanel } from '@/components/admin/AchievementDefinitionsPanel'
import { AdminPageLayout } from '@/components/admin/AdminPageLayout'
import { loadAdminAchievementDefinitionsPage } from '@/lib/admin-achievement-definitions-page'

export default async function AdminAchievementDefinitionsPage() {
  const initialData = await loadAdminAchievementDefinitionsPage(
    (await cookies()).toString()
  )
  return (
    <AdminPageLayout section='achievement-definitions'>
      <AchievementDefinitionsPanel initialData={initialData} />
    </AdminPageLayout>
  )
}
