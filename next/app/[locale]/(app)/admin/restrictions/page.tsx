import { AdminAccessGate } from '@/components/admin/AdminAccessGate'
import { AdminPageLayout } from '@/components/admin/AdminPageLayout'
import { RestrictionsPanel } from '@/components/admin/RestrictionsPanel'
import { requireAdminUnlock } from '@/lib/admin-page-guard'
import { loadAdminRestrictionsPage } from '@/lib/admin-restrictions-page'

export default async function AdminRestrictionsPage() {
  const cookie = await requireAdminUnlock()
  if (!cookie) return <AdminAccessGate />

  const initialData = await loadAdminRestrictionsPage(cookie)
  return (
    <AdminPageLayout section='restrictions'>
      <RestrictionsPanel initialData={initialData} />
    </AdminPageLayout>
  )
}
