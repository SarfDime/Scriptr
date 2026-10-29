import type { QueryApiEndpointType } from '@shared/types/api.types'
import { generatePath } from '@shared/utils/common-utils'
import { API_URL } from '@/config/env'
import { nextLogs } from '@/lib/logger'

export type ApiFetchOptions = Omit<RequestInit, 'body'> & {
  /** Accepts a raw object for JSON, FormData for files, or standard BodyInit */
  body?: Record<string, unknown> | FormData | BodyInit | null
  /** Overrides the default timeout, for requests that legitimately take longer
   * (e.g. finalizing an upload). */
  timeoutMs?: number
}

const API_REQUEST_TIMEOUT_MS = 10_000

/**
 * Carries the HTTP status so callers (e.g. useProtectedAction) can distinguish
 * a 403 restriction rejection from other failures without string-matching the
 * message. `apiFetchRequired` rethrows this after `apiFetch` records a failure.
 */
export class ApiError extends Error {
  status: number
  /** The `field` an error body names (e.g. a register `409`), when present. */
  field: string | undefined
  /** The whole JSON error body, for details beyond the message (for example
   * which file an upload rejection is about). */
  data: Record<string, unknown> | undefined

  constructor(
    message: string,
    status: number,
    field?: string,
    data?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.field = field
    this.data = data
  }
}

type ApiFetchResult<T> = { success: true; data: T } | { success: false }

const performApiFetch = async <T>(
  path: QueryApiEndpointType,
  options: ApiFetchOptions = {}
): Promise<ApiFetchResult<T>> => {
  try {
    const {
      body,
      headers: customHeaders,
      timeoutMs = API_REQUEST_TIMEOUT_MS,
      ...restOptions
    } = options
    const headers = new Headers(customHeaders)
    let fetchBody: BodyInit | null | undefined

    if (body instanceof FormData) {
      fetchBody = body
    } else if (body && typeof body === 'object') {
      fetchBody = JSON.stringify(body)
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
      }
    } else {
      fetchBody = body as BodyInit | null | undefined
    }

    const url = generatePath({ segments: [API_URL, path] })
    const timeoutSignal = AbortSignal.timeout(timeoutMs)
    const signal = restOptions.signal
      ? AbortSignal.any([restOptions.signal, timeoutSignal])
      : timeoutSignal

    const response = await fetch(url, {
      credentials: 'include',
      headers,
      body: fetchBody,
      ...restOptions,
      signal,
    })

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`
      let errorField: string | undefined
      let errorBody: Record<string, unknown> | undefined
      try {
        const errorData = await response.json()
        errorMessage = errorData?.error ?? errorData?.message ?? errorMessage
        errorField =
          typeof errorData?.field === 'string' ? errorData.field : undefined
        errorBody =
          typeof errorData === 'object' && errorData !== null
            ? (errorData as Record<string, unknown>)
            : undefined
      } catch {
        // Preserve the status when an upstream proxy returns HTML.
      }
      throw new ApiError(errorMessage, response.status, errorField, errorBody)
    }

    if (response.status === 204) {
      return { success: true, data: {} as T }
    }

    return { success: true, data: (await response.json()) as T }
  } catch (error) {
    nextLogs({
      message: `API request failed or is unavailable for ${path}.`,
      logLevel: 'warn',
      error,
    })
    if (error instanceof ApiError) {
      throw error
    }
    return { success: false }
  }
}

export async function apiFetch<T>(
  path: QueryApiEndpointType,
  options: ApiFetchOptions = {}
): Promise<T | null> {
  const result = await performApiFetch<T>(path, options)
  return result.success ? result.data : null
}

export async function apiFetchRequired<T>(
  path: QueryApiEndpointType,
  options: ApiFetchOptions = {}
): Promise<T> {
  const result = await performApiFetch<T>(path, options)
  if (!result.success) {
    throw new ApiError(`API request unavailable for ${path}`, 503)
  }

  return result.data
}

/**
 * Allows public reads to render an empty state when the API is unavailable
 * during a build or request.
 */
export async function apiFetchPublicRead<T>(
  path: QueryApiEndpointType,
  fallback: T,
  options: ApiFetchOptions = {}
): Promise<T> {
  try {
    const result = await apiFetch<T>(path, options)
    return result ?? fallback
  } catch (error) {
    nextLogs({
      message: `Public API read failed for ${path}; using the fallback value.`,
      logLevel: 'warn',
      error,
    })
    return fallback
  }
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
    : { cache: 'force-cache', next: { tags } }
}
