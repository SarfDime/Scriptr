import { apiRoutes } from '@shared/config/api-routes'
import type {
  CallbackRequest,
  CallbackResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  RegisterRequest,
  RegisterResponse,
  SessionResponse,
} from '@shared/types/auth.types'
import { apiFetch, apiFetchRequired } from './next-api'

export const registerUser = (body: RegisterRequest) =>
  apiFetchRequired<RegisterResponse>(apiRoutes.auth.register, {
    method: 'POST',
    body,
  })

export const loginUser = (body: LoginRequest) =>
  apiFetchRequired<LoginResponse>(apiRoutes.auth.login, {
    method: 'POST',
    body,
  })

export const logoutUser = () =>
  apiFetchRequired<LogoutResponse>(apiRoutes.auth.logout, {
    method: 'POST',
  })

export const completeAuthCallback = (body: CallbackRequest) =>
  apiFetchRequired<CallbackResponse>(apiRoutes.auth.callback, {
    method: 'POST',
    body,
  })

/**
 * Both session reads share these options. Never cached: the cookie makes the
 * response personal.
 */
const sessionOptions = (cookie?: string) =>
  ({
    cache: 'no-store',
    ...(cookie ? { headers: { cookie } } : {}),
  }) as const

/**
 * Session-scoped, like getMyScriptVote: never cached, since the cookie
 * makes this personalized. Two call shapes:
 * - No `cookie` arg (default): a Client Component call — the browser
 *   attaches the cookie itself via apiFetch's `credentials: 'include'`.
 * - `cookie` arg: a Server Component forwarding the incoming request's
 *   cookie header (see getRequestCookieHeader in next-api.ts).
 *
 * Resolves to `null` when the request fails, so it suits public pages that can
 * fall back to the guest view. Use `getSessionRequired` where a signed-out
 * result triggers something.
 */
export const getSession = (cookie?: string) =>
  apiFetch<SessionResponse>(apiRoutes.auth.session, sessionOptions(cookie))

/**
 * Like `getSession`, but a failed request (API unreachable, timeout, non-2xx)
 * throws an `ApiError` instead of resolving to `null`. Use it where "signed
 * out" triggers something (a redirect to `/auth`), so an outage is shown as an
 * error and not mistaken for a signed-out visitor. A signed-out visitor is
 * still a normal `200` with `user: null`.
 */
export const getSessionRequired = (cookie?: string) =>
  apiFetchRequired<SessionResponse>(
    apiRoutes.auth.session,
    sessionOptions(cookie)
  )
