import { AdminAccessGate } from '@/components/admin/AdminAccessGate'
import { AdminPageLayout } from '@/components/admin/AdminPageLayout'
import { UsersPanel } from '@/components/admin/UsersPanel'
import { requireAdminUnlock } from '@/lib/admin-page-guard'
import { loadAdminUsersPage } from '@/lib/admin-users-page'

export default async function AdminUsersPage() {
  const cookie = await requireAdminUnlock()
  if (!cookie) return <AdminAccessGate />

  const initialData = await loadAdminUsersPage(cookie)
  return (
    <AdminPageLayout section='users'>
      <UsersPanel initialData={initialData} />
    </AdminPageLayout>
  )
}
