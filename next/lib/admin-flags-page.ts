import type { AdminFlagsViewModel } from '@/types/components/Admin.types'
import { getSelectedAdminStudy } from './admin-study-server'
import { getAdminFlags } from './api/flags-api'

export const loadAdminFlagsPage = async (
  cookie: string
): Promise<AdminFlagsViewModel | null> => {
  try {
    const study = await getSelectedAdminStudy()
    const flags = await getAdminFlags('pending', cookie, study)
    return { flags, status: 'pending' }
  } catch {
    return null
  }
}
