import type { AdminRestrictionsViewModel } from '@/types/components/Admin.types'
import { getLiftedRestrictions, getRestrictions } from './api/restrictions-api'

export const loadAdminRestrictionsPage = async (
  cookie: string
): Promise<AdminRestrictionsViewModel | null> => {
  try {
    const [restrictions, lifted] = await Promise.all([
      getRestrictions(cookie),
      getLiftedRestrictions(cookie),
    ])
    return { restrictions, lifted }
  } catch {
    return null
  }
}
