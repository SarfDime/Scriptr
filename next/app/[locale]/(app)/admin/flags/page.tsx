import { Suspense } from 'react'
import { AdminAccessGate } from '@/components/admin/AdminAccessGate'
import { AdminPageLayout } from '@/components/admin/AdminPageLayout'
import { AdminPageSkeleton } from '@/components/admin/AdminPageSkeleton'
import { FlagsQueue } from '@/components/admin/FlagsQueue'
import { loadAdminFlagsPage } from '@/lib/admin-flags-page'
import { requireAdminUnlock } from '@/lib/admin-page-guard'

export default function AdminFlagsPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminFlagsContent />
    </Suspense>
  )
}

async function AdminFlagsContent() {
  const cookie = await requireAdminUnlock()
  if (!cookie) return <AdminAccessGate />

  const initialData = await loadAdminFlagsPage(cookie)
  return (
    <AdminPageLayout section='flags'>
      <FlagsQueue initialData={initialData} />
    </AdminPageLayout>
  )
}
