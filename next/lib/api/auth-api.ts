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
import { apiFetch } from './next-api'

export const registerUser = (body: RegisterRequest) =>
  apiFetch<RegisterResponse>(apiRoutes.auth.register, {
    method: 'POST',
    body,
  })

export const loginUser = (body: LoginRequest) =>
  apiFetch<LoginResponse>(apiRoutes.auth.login, {
    method: 'POST',
    body,
  })

export const logoutUser = () =>
  apiFetch<LogoutResponse>(apiRoutes.auth.logout, {
    method: 'POST',
  })

export const completeAuthCallback = (body: CallbackRequest) =>
  apiFetch<CallbackResponse>(apiRoutes.auth.callback, {
    method: 'POST',
    body,
  })

/**
 * Session-scoped, like getMyScriptVote: never cached, since the cookie
 * makes this personalized. Two call shapes:
 * - No `cookie` arg (default): a Client Component call — the browser
 *   attaches the cookie itself via apiFetch's `credentials: 'include'`.
 * - `cookie` arg: a Server Component forwarding the incoming request's
 *   cookie header (see getRequestCookieHeader in next-api.ts).
 */
export const getSession = (cookie?: string) =>
  apiFetch<SessionResponse>(apiRoutes.auth.session, {
    cache: 'no-store',
    ...(cookie ? { headers: { cookie } } : {}),
  })
