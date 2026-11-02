import { cookies } from 'next/headers'
import { AdminPageLayout } from '@/components/admin/AdminPageLayout'
import { RatingTypesPanel } from '@/components/admin/RatingTypesPanel'
import { loadAdminRatingTypesPage } from '@/lib/admin-rating-types-page'

export default async function AdminRatingTypesPage() {
  const initialData = await loadAdminRatingTypesPage(
    (await cookies()).toString()
  )
  return (
    <AdminPageLayout section='rating-types'>
      <RatingTypesPanel initialData={initialData} />
    </AdminPageLayout>
  )
}
