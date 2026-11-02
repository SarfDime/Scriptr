import { apiRoutes } from '@shared/config/api-routes'
import type {
  AdminFlag,
  FlagMutationResponse,
  FlagStatus,
} from '@shared/types/flags.types'
import { apiFetchRequired } from './next-api'

export const getAdminFlags = (status: FlagStatus, cookie?: string) =>
  apiFetchRequired<Array<AdminFlag>>(
    status === 'pending'
      ? apiRoutes.flags.pending
      : apiRoutes.flags.statusByStatus(status),
    {
      cache: 'no-store',
      ...(cookie ? { headers: { cookie } } : {}),
    }
  )

export const updateFlagStatus = (id: string, status: FlagStatus) =>
  apiFetchRequired<FlagMutationResponse>(apiRoutes.flags.byId(id), {
    method: 'PATCH',
    body: { status },
  })

export const deleteFlag = (id: string) =>
  apiFetchRequired<{ success: true }>(apiRoutes.flags.byId(id), {
    method: 'DELETE',
  })
