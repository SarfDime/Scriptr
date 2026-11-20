import { Suspense } from 'react'
import { AdminAccessGate } from '@/components/admin/AdminAccessGate'
import { AdminPageLayout } from '@/components/admin/AdminPageLayout'
import { AdminPageSkeleton } from '@/components/admin/AdminPageSkeleton'
import { DownloadReviewPanel } from '@/components/admin/DownloadReviewPanel'
import { loadAdminDownloadReviewPage } from '@/lib/admin-download-review-page'
import { requireAdminUnlock } from '@/lib/admin-page-guard'

export default function AdminDownloadReviewPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminDownloadReviewContent />
    </Suspense>
  )
}

async function AdminDownloadReviewContent() {
  const cookie = await requireAdminUnlock()
  if (!cookie) return <AdminAccessGate />

  const initialData = await loadAdminDownloadReviewPage(cookie)
  return (
    <AdminPageLayout section='download-review'>
      <DownloadReviewPanel initialData={initialData} />
    </AdminPageLayout>
  )
}
