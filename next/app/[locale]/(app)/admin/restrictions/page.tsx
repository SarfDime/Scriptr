import { Suspense } from 'react'
import { AdminAccessGate } from '@/components/admin/AdminAccessGate'
import { AdminPageLayout } from '@/components/admin/AdminPageLayout'
import { AdminPageSkeleton } from '@/components/admin/AdminPageSkeleton'
import { RestrictionsPanel } from '@/components/admin/RestrictionsPanel'
import { requireAdminUnlock } from '@/lib/admin-page-guard'
import { loadAdminRestrictionsPage } from '@/lib/admin-restrictions-page'

export default function AdminRestrictionsPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminRestrictionsContent />
    </Suspense>
  )
}

async function AdminRestrictionsContent() {
  const cookie = await requireAdminUnlock()
  if (!cookie) return <AdminAccessGate />

  const initialData = await loadAdminRestrictionsPage(cookie)
  return (
    <AdminPageLayout section='restrictions'>
      <RestrictionsPanel initialData={initialData} />
    </AdminPageLayout>
  )
}
