import { AdminPageLayout } from '@/components/admin/AdminPageLayout'
import { RatingTypesPanel } from '@/components/admin/RatingTypesPanel'
import { loadAdminRatingTypesPage } from '@/lib/admin-rating-types-page'

export default async function AdminRatingTypesPage() {
  const initialData = await loadAdminRatingTypesPage()
  return (
    <AdminPageLayout section='rating-types'>
      <RatingTypesPanel initialData={initialData} />
    </AdminPageLayout>
  )
}
