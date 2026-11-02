import { cookies } from 'next/headers'
import { AdminPageLayout } from '@/components/admin/AdminPageLayout'
import { FlagsQueue } from '@/components/admin/FlagsQueue'
import { loadAdminFlagsPage } from '@/lib/admin-flags-page'

export default async function AdminFlagsPage() {
  const initialData = await loadAdminFlagsPage((await cookies()).toString())
  return (
    <AdminPageLayout section='flags'>
      <FlagsQueue initialData={initialData} />
    </AdminPageLayout>
  )
}
