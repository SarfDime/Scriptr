import type { AdminRatingTypesViewModel } from '@/types/components/Admin.types'
import { getAllRatingTypes } from './api/ratings-api'

export const loadAdminRatingTypesPage = async (
  cookie: string
): Promise<AdminRatingTypesViewModel | null> => {
  try {
    const ratingTypes = await getAllRatingTypes(cookie)
    return { ratingTypes }
  } catch {
    return null
  }
}
