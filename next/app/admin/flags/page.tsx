import { AdminAccessGate } from '@/components/admin/AdminAccessGate'
import { AdminPageLayout } from '@/components/admin/AdminPageLayout'
import { FlagsQueue } from '@/components/admin/FlagsQueue'
import { loadAdminFlagsPage } from '@/lib/admin-flags-page'
import { requireAdminUnlock } from '@/lib/admin-page-guard'

export default async function AdminFlagsPage() {
  const cookie = await requireAdminUnlock()
  if (!cookie) return <AdminAccessGate />

  const initialData = await loadAdminFlagsPage(cookie)
  return (
    <AdminPageLayout section='flags'>
      <FlagsQueue initialData={initialData} />
    </AdminPageLayout>
  )
}
