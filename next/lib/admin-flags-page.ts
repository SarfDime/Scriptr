import type { AdminFlagsViewModel } from '@/types/components/Admin.types'
import { getAdminFlags } from './api/flags-api'

export const loadAdminFlagsPage = async (
  cookie: string
): Promise<AdminFlagsViewModel | null> => {
  try {
    const flags = await getAdminFlags('pending', cookie)
    return { flags, status: 'pending' }
  } catch {
    return null
  }
}
