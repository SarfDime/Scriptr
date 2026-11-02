import { cookies } from 'next/headers'
import { AdminPageLayout } from '@/components/admin/AdminPageLayout'
import { RestrictionsPanel } from '@/components/admin/RestrictionsPanel'
import { loadAdminRestrictionsPage } from '@/lib/admin-restrictions-page'

export default async function AdminRestrictionsPage() {
  const initialData = await loadAdminRestrictionsPage(
    (await cookies()).toString()
  )
  return (
    <AdminPageLayout section='restrictions'>
      <RestrictionsPanel initialData={initialData} />
    </AdminPageLayout>
  )
}
