import type { QueryApiEndpointType } from '@shared/types/api.types'
import { generatePath } from '@shared/utils/common-utils'
import { API_URL } from '@/config/env'

export type ApiFetchOptions = Omit<RequestInit, 'body'> & {
  /** Accepts a raw object for JSON, FormData for files, or standard BodyInit */
  body?: Record<string, unknown> | FormData | BodyInit | null
}

/**
 * Thrown by apiFetch on a non-ok response. Carries the HTTP status so
 * callers (e.g. useProtectedAction) can distinguish a 403 restriction
 * rejection from other failures without string-matching the message.
 * This is the one addition to this file beyond what was uploaded — no new
 * fetching pattern, just enough on the existing error to classify it.
 */
export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiFetch<T>(
  path: QueryApiEndpointType,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { body, headers: customHeaders, ...restOptions } = options
  const headers = new Headers(customHeaders)
  let fetchBody: BodyInit | null | undefined

  // 1. Smart Body Serialization
  if (body instanceof FormData) {
    // Browser automatically sets Content-Type to 'multipart/form-data' with the correct boundary
    fetchBody = body
  } else if (body && typeof body === 'object') {
    // Auto-stringify JSON and set headers
    fetchBody = JSON.stringify(body)
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
  } else {
    fetchBody = body as BodyInit | null | undefined
  }

  const url = generatePath({ segments: [API_URL, path] })

  // `credentials: 'include'` is required for cookie-based auth to survive
  // a cross-origin call from the browser — fetch's default is
  // 'same-origin', which silently drops the session cookie on any request
  // this file's Client Component callers make (postComment, postReply,
  // postReaction, toggleLike in comments-api.ts; any equivalent future
  // client-invoked mutation elsewhere). The three server-forwarded-cookie
  // reads in comments-api.ts/scripts-api.ts (via getRequestCookieHeader /
  // cachedUnlessPersonalized) are unaffected — `credentials` has no
  // meaning for a server-to-server fetch, only for a browser one.
  // `...restOptions` still wins if a caller ever needs to override this.
  const response = await fetch(url, {
    credentials: 'include',
    headers,
    body: fetchBody,
    ...restOptions,
  })

  // 2. Universal Error Interception
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`
    try {
      const errorData = await response.json()
      errorMessage = errorData?.error ?? errorData?.message ?? errorMessage
    } catch {
      // Failsafe if the server crashes and returns non-JSON HTML
    }
    throw new ApiError(errorMessage, response.status)
  }

  // 3. Handle 204 No Content gracefully
  if (response.status === 204) {
    return {} as T
  }

  return response.json() as Promise<T>
}

/**
 * Reads the current request's `Cookie` header, for a Server Component to
 * forward to the Hono API (session-gated endpoints like GET /my-scripts
 * need it explicitly — see ARCHITECTURE.md §1: cookie-based Supabase auth,
 * no Bearer-token path, and a server-to-server fetch doesn't carry the
 * browser's cookies automatically).
 *
 * Deliberately NOT called automatically inside apiFetch above. `cookies()`
 * (from next/headers) marks the *entire calling route* as dynamic — it
 * opts the route out of static generation. apiFetch is the one fetch
 * wrapper used for every API call in the app (AGENTS.md), so making cookie
 * reads automatic there would silently force every page that calls it —
 * including statically-generated pages with no session-dependent data at
 * all — into full dynamic rendering. Call sites that genuinely need
 * session-aware data (faculty-scoped catalog reads, "my X" endpoints,
 * comment engagement flags) opt in explicitly instead.
 *
 * Implemented as a dynamic import, not a static one, because this file is
 * imported from Client Components too (e.g. CommentSection.tsx) — a
 * top-level `import { cookies } from 'next/headers'` would break that
 * client bundle at build time, even though this function is never called
 * from client code in practice.
 */
export async function getRequestCookieHeader(): Promise<string> {
  const { cookies } = await import('next/headers')
  return (await cookies()).toString()
}

/**
 * The "cached-unless-personalized" pattern used by every -api.ts read that
 * can optionally be scoped to the requesting user (scripts-api.ts,
 * comments-api.ts). Without a cookie: the normal tag-based Data Cache
 * entry, shared across all callers. With a cookie: forced `no-store` —
 * Next's fetch cache keys primarily by URL, not by headers, so a
 * personalized (e.g. faculty-scoped) result cached under a shared tag
 * could otherwise leak from one user to another. "Forward a cookie" and
 * "bypass the shared cache" are intentionally the same decision here, not
 * two separate things a caller could get out of sync.
 */
export function cachedUnlessPersonalized(
  cookie: string | undefined,
  tags: Array<string>
): Pick<ApiFetchOptions, 'headers' | 'cache'> & {
  next?: { tags: Array<string> }
} {
  return cookie
    ? { headers: { cookie }, cache: 'no-store' }
    : { next: { tags } }
}
