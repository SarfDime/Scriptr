import { apiRoutes } from '@shared/config/api-routes'
import type { AccessTokenResponse } from '@shared/types/access.types'
import { API_URL } from '@/config/env'
import { apiFetchRequired } from './next-api'

/**
 * Unlocks the website's admin surface for ten minutes. The API sets an
 * HttpOnly cookie, so the server-rendered admin pages see it on the next
 * request; the returned token is only useful to scripted callers.
 */
export const requestAdminAccess = (code: string) =>
  apiFetchRequired<AccessTokenResponse>(apiRoutes.admin.access, {
    method: 'POST',
    body: { code },
  })

/**
 * Whether the operator currently holds a live unlock. Called by the admin
 * layout before rendering, so an expired cookie shows the unlock form instead
 * of a page whose every request would be rejected.
 *
 * Deliberately not `apiFetch`: a locked visitor is the normal case, and that
 * helper rethrows every non-ok response as an `ApiError` (log included) — the
 * layout would crash instead of rendering the form. An unreachable API counts
 * as locked too; the form then reports that it cannot reach it.
 */
export const isAdminUnlocked = async (cookie: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}${apiRoutes.admin.access}`, {
      headers: { cookie },
      cache: 'no-store',
    })

    return response.ok
  } catch {
    return false
  }
}
