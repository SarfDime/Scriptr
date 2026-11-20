import { Suspense } from 'react'
import { AdminAccessGate } from '@/components/admin/AdminAccessGate'
import { AdminPageLayout } from '@/components/admin/AdminPageLayout'
import { AdminPageSkeleton } from '@/components/admin/AdminPageSkeleton'
import { RatingTypesPanel } from '@/components/admin/RatingTypesPanel'
import { requireAdminUnlock } from '@/lib/admin-page-guard'
import { loadAdminRatingTypesPage } from '@/lib/admin-rating-types-page'

export default function AdminRatingTypesPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminRatingTypesContent />
    </Suspense>
  )
}

async function AdminRatingTypesContent() {
  const cookie = await requireAdminUnlock()
  if (!cookie) return <AdminAccessGate />

  const initialData = await loadAdminRatingTypesPage()
  return (
    <AdminPageLayout section='rating-types'>
      <RatingTypesPanel initialData={initialData} />
    </AdminPageLayout>
  )
}
