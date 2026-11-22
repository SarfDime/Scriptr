import { Suspense } from 'react'
import { AdminAccessGate } from '@/components/admin/AdminAccessGate'
import { AdminPageLayout } from '@/components/admin/AdminPageLayout'
import { AdminPageSkeleton } from '@/components/admin/AdminPageSkeleton'
import { AnnouncementPanel } from '@/components/admin/AnnouncementPanel'
import { requireAdminUnlock } from '@/lib/admin-page-guard'

/** Anonymous validation hits the gate's 404, so this page has no instant UI to assert. */
export const instant = false

export default function AdminAnnouncementsPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminAnnouncementsContent />
    </Suspense>
  )
}

async function AdminAnnouncementsContent() {
  const cookie = await requireAdminUnlock()
  if (!cookie) return <AdminAccessGate />

  return (
    <AdminPageLayout section='announcements'>
      <AnnouncementPanel />
    </AdminPageLayout>
  )
}
