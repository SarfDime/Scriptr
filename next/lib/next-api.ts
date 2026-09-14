import type { QueryApiEndpointType } from '@shared/types/api.types'
import { generatePath } from '@shared/utils/common-utils'

type ApiFetchOptions = Omit<RequestInit, 'body'> & {
  /** Accepts a raw object for JSON, FormData for files, or standard BodyInit */
  body?: Record<string, unknown> | FormData | BodyInit | null
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

  const url = generatePath({
    segments: [
      process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787',
      path,
    ],
  })

  const response = await fetch(url, {
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
    throw new Error(errorMessage)
  }

  // 3. Handle 204 No Content gracefully
  if (response.status === 204) {
    return {} as T
  }

  return response.json() as Promise<T>
}
