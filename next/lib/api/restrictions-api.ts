import { apiRoutes } from '@shared/config/api-routes'
import type { MyRestriction } from '@shared/types/restrictions.types'
import { apiFetchRequired } from './next-api'

/** Requires a session. Resolves `null` when the caller isn't restricted. */
export const getMyRestriction = () =>
  apiFetchRequired<MyRestriction>(apiRoutes.restrictions.me, {
    cache: 'no-store',
  })
