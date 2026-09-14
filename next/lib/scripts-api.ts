import { apiRoutes } from '@shared/config/api-routes'
import { SCRIPT_CACHE_TAGS } from '@shared/config/cache-tags'
import { apiFetch } from './next-api'

/** Cached: revalidated via the scripts:list tag when any script changes. */
export const getScripts = <T>() =>
  apiFetch<T>(apiRoutes.scripts.index, {
    next: { tags: [SCRIPT_CACHE_TAGS.list()] },
  })

/** Cached: revalidated via the scripts:subject:<id> and scripts:list tags. */
export const getScriptsBySubject = <T>(subjectId: string) =>
  apiFetch<T>(apiRoutes.scripts.subjectBySubjectId(subjectId), {
    next: {
      tags: [SCRIPT_CACHE_TAGS.subject(subjectId), SCRIPT_CACHE_TAGS.list()],
    },
  })

/** Cached: revalidated via the scripts:top tag. */
export const getTopScripts = <T>(limit = 10) =>
  apiFetch<T>(apiRoutes.scripts.top(limit), {
    next: { tags: [SCRIPT_CACHE_TAGS.top()] },
  })

/** Cached: revalidated via the scripts:popular tag. */
export const getPopularScripts = <T>(limit = 10) =>
  apiFetch<T>(apiRoutes.scripts.popular(limit), {
    next: { tags: [SCRIPT_CACHE_TAGS.popular()] },
  })

/** Cached: revalidated via the scripts:detail:<id> tag. */
export const getScript = <T>(scriptId: string) =>
  apiFetch<T>(apiRoutes.scripts.byId(scriptId), {
    next: { tags: [SCRIPT_CACHE_TAGS.detail(scriptId)] },
  })

/** Never cached: search results must always reflect the live dataset. */
export const searchScripts = <T>(query: string) =>
  apiFetch<T>(apiRoutes.scripts.search(query), { cache: 'no-store' })

/** Never cached: results are scoped to the requesting user's session. */
export const getMyScripts = <T>(cookie: string) =>
  apiFetch<T>(apiRoutes.scripts.myScripts, {
    headers: { cookie },
    cache: 'no-store',
  })
