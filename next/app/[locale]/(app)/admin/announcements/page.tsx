import { AdminAccessGate } from '@/components/admin/AdminAccessGate'
import { AdminPageLayout } from '@/components/admin/AdminPageLayout'
import { AnnouncementPanel } from '@/components/admin/AnnouncementPanel'
import { requireAdminUnlock } from '@/lib/admin-page-guard'

export default async function AdminAnnouncementsPage() {
  const cookie = await requireAdminUnlock()
  if (!cookie) return <AdminAccessGate />

  return (
    <AdminPageLayout section='announcements'>
      <AnnouncementPanel />
    </AdminPageLayout>
  )
}
