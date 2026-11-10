import { AdminAccessGate } from '@/components/admin/AdminAccessGate'
import { AdminPageLayout } from '@/components/admin/AdminPageLayout'
import { RatingTypesPanel } from '@/components/admin/RatingTypesPanel'
import { requireAdminUnlock } from '@/lib/admin-page-guard'
import { loadAdminRatingTypesPage } from '@/lib/admin-rating-types-page'

export default async function AdminRatingTypesPage() {
  const cookie = await requireAdminUnlock()
  if (!cookie) return <AdminAccessGate />

  const initialData = await loadAdminRatingTypesPage()
  return (
    <AdminPageLayout section='rating-types'>
      <RatingTypesPanel initialData={initialData} />
    </AdminPageLayout>
  )
}
