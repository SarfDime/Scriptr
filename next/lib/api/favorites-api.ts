import { apiRoutes } from '@shared/config/api-routes'
import { apiFetch } from './next-api'

type FavoriteRecord = {
  created_at: string
}

/** Pass `cookieHeader` when calling from a Server Component so the session
 * is forwarded (same convention as getMyScriptVote / getScript). */
export const getFavorite = (scriptId: string, cookieHeader?: string) =>
  apiFetch<FavoriteRecord | null>(apiRoutes.favorites.byScriptId(scriptId), {
    cache: 'no-store',
    ...(cookieHeader && { headers: { cookie: cookieHeader } }),
  })

export const addFavorite = (scriptId: string) =>
  apiFetch<FavoriteRecord>(apiRoutes.favorites.byScriptId(scriptId), {
    method: 'POST',
  })

export const removeFavorite = (scriptId: string) =>
  apiFetch<{ success: true }>(apiRoutes.favorites.byScriptId(scriptId), {
    method: 'DELETE',
  })
