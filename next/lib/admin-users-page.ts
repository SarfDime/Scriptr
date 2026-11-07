import { ADMIN_PROFILES_PAGE_SIZE } from '@shared/config/shared-constants'
import type { AdminProfilesQuery } from '@shared/types/profile.types'
import type { AdminUsersViewModel } from '@/types/components/Admin.types'
import { getAdminProfiles } from './api/profile-api'

/** The query the panel starts on: the newest accounts first, one page. */
export const DEFAULT_ADMIN_USERS_QUERY: AdminProfilesQuery = {
  limit: ADMIN_PROFILES_PAGE_SIZE,
  offset: 0,
  sort: 'created_at',
  order: 'desc',
}

/** First page of the admin user manager. `null` when the API refused or was
 * unreachable, which the panel renders as its error state. */
export const loadAdminUsersPage = async (
  cookie: string
): Promise<AdminUsersViewModel | null> => {
  try {
    const page = await getAdminProfiles(DEFAULT_ADMIN_USERS_QUERY, cookie)
    return { page, query: DEFAULT_ADMIN_USERS_QUERY }
  } catch {
    return null
  }
}
