import { apiRoutes } from '@shared/config/api-routes'
import type { FlagRow, FlagTargetType } from '@shared/types/api.types'
import { apiFetch } from './next-api'

/** Current user's flags, used to avoid duplicate report submissions. */
export const getMyFlags = () =>
  apiFetch<Array<FlagRow>>(apiRoutes.flags.myFlags, { cache: 'no-store' })

/**
 * POST apiRoutes.flags.index body is { target_type, target_id, reason } — a
 * generic pair, not per-target FK fields — resolved server-side into the
 * DB's single target_script_id / target_user_id / target_comment_id column.
 */
export const submitFlag = async (
  targetType: FlagTargetType,
  targetId: string,
  reason: string
) => {
  return apiFetch(apiRoutes.flags.index, {
    method: 'POST',
    body: { target_type: targetType, target_id: targetId, reason },
  })
}
