import { ACCESS_TOKEN_HEADER } from '@shared/config/access'
import { apiRoutes } from '@shared/config/api-routes'
import type {
  AccessToken,
  AccessTokenResponse,
} from '@shared/types/access.types'

/**
 * Access to the API's `/api/sanity` routes from inside the Studio.
 *
 * The Studio runs in a browser, so it must never hold a long-lived credential —
 * anything bundled here is public. Instead the operator enters a TOTP code once
 * per twenty minutes and the API issues a token that only these calls use.
 */

/** Studio builds inline `SANITY_STUDIO_*` env vars at build time. */
export const STUDIO_API_URL =
  process.env.SANITY_STUDIO_API_URL ?? 'http://localhost:8787'

/**
 * In memory on purpose: a reload drops the token and the next action asks for a
 * code again, so leaving the Studio open does not leave write access behind.
 */
let accessToken: AccessToken | null = null

/** Treat a token as spent slightly early, so an action that starts a second
 * before expiry does not fail halfway through. */
const EXPIRY_MARGIN_MS = 5_000

const isSpent = (candidate: AccessToken): boolean =>
  candidate.expiresAt - EXPIRY_MARGIN_MS <= Date.now()

export const hasValidAccessToken = (): boolean =>
  accessToken !== null && !isSpent(accessToken)

/** Raised when a request needs a fresh code, so callers can prompt for one
 * instead of reporting a failure. */
export class AccessCodeRequiredError extends Error {
  constructor(message = 'Enter your access code to continue.') {
    super(message)
    this.name = 'AccessCodeRequiredError'
  }
}

export function clearAccessToken(): void {
  accessToken = null
}

/** Exchanges a six-digit code for a twenty-minute token. Throws with the
 * API's own wording when the code is rejected. */
export async function requestAccessToken(code: string): Promise<void> {
  const response = await fetch(`${STUDIO_API_URL}${apiRoutes.sanity.access}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })

  const result = (await response.json().catch(() => null)) as {
    token?: unknown
    expiresAt?: unknown
    error?: unknown
  } | null

  if (
    !response.ok ||
    typeof result?.token !== 'string' ||
    typeof result.expiresAt !== 'number'
  ) {
    throw new Error(
      typeof result?.error === 'string'
        ? result.error
        : 'The access code was rejected.'
    )
  }

  const issued = result as AccessTokenResponse
  accessToken = { token: issued.token, expiresAt: issued.expiresAt }
}

/** Sends an admin request with the current token. A 401 drops the token so the
 * caller asks for a new code rather than retrying a spent one. */
export async function adminFetch(
  url: string,
  init: Omit<RequestInit, 'headers'> = {}
): Promise<Response> {
  const current = accessToken
  if (!current || isSpent(current)) {
    clearAccessToken()
    throw new AccessCodeRequiredError()
  }

  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      [ACCESS_TOKEN_HEADER]: current.token,
    },
  })

  if (response.status === 401) {
    clearAccessToken()
    throw new AccessCodeRequiredError(
      'The access code expired. Run the action again to enter a new one.'
    )
  }

  return response
}
