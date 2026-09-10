import { SCRIPT_CACHE_TAGS } from '@shared/config/cache-tags'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init)

  if (!response.ok) {
    throw new Error(`Request to ${path} failed with ${response.status}`)
  }

  return response.json() as Promise<T>
}

/** Cached: revalidated via the scripts:list tag when any script changes. */
export const getScripts = <T>() =>
  fetchJson<T>('/api/scripts', { next: { tags: [SCRIPT_CACHE_TAGS.list()] } })

/** Cached: revalidated via the scripts:subject:<id> and scripts:list tags. */
export const getScriptsBySubject = <T>(subjectId: string) =>
  fetchJson<T>(`/api/scripts/subject/${subjectId}`, {
    next: {
      tags: [SCRIPT_CACHE_TAGS.subject(subjectId), SCRIPT_CACHE_TAGS.list()],
    },
  })

/** Cached: revalidated via the scripts:top tag. */
export const getTopScripts = <T>(limit = 10) =>
  fetchJson<T>(`/api/scripts/top?limit=${limit}`, {
    next: { tags: [SCRIPT_CACHE_TAGS.top()] },
  })

/** Cached: revalidated via the scripts:popular tag. */
export const getPopularScripts = <T>(limit = 10) =>
  fetchJson<T>(`/api/scripts/popular?limit=${limit}`, {
    next: { tags: [SCRIPT_CACHE_TAGS.popular()] },
  })

/** Cached: revalidated via the scripts:detail:<id> tag. */
export const getScript = <T>(scriptId: string) =>
  fetchJson<T>(`/api/scripts/${scriptId}`, {
    next: { tags: [SCRIPT_CACHE_TAGS.detail(scriptId)] },
  })

/** Never cached: search results must always reflect the live dataset. */
export const searchScripts = <T>(query: string) =>
  fetchJson<T>(`/api/scripts/search?q=${encodeURIComponent(query)}`, {
    cache: 'no-store',
  })

/** Never cached: results are scoped to the requesting user's session. */
export const getMyScripts = <T>(cookie: string) =>
  fetchJson<T>('/api/scripts/my-scripts', {
    headers: { cookie },
    cache: 'no-store',
  })
