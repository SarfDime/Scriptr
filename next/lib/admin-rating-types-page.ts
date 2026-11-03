import type { AdminRatingTypesViewModel } from '@/types/components/Admin.types'
import { getAllRatingTypes } from './api/ratings-api'

export const loadAdminRatingTypesPage =
  async (): Promise<AdminRatingTypesViewModel | null> => {
    try {
      const ratingTypes = await getAllRatingTypes()
      return { ratingTypes }
    } catch {
      return null
    }
  }
