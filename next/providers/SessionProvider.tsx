'use client'

import { UI_STRINGS_PACK } from '@shared/config/strings'
import type {
  CallbackRequest,
  LoginRequest,
  RegisterConflictField,
  RegisterRequest,
  SessionUser,
} from '@shared/types/auth.types'
import type { ResolvedStrings } from '@shared/types/localization.types'
import { useRouter } from 'next/navigation'
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'
import { clearAccountState } from '@/lib/account-state-storage'
import {
  completeAuthCallback,
  getSession,
  loginUser,
  logoutUser,
  registerUser,
} from '@/lib/api/auth-api'
import { ApiError } from '@/lib/api/next-api'
import { useStrings } from '@/providers/locale/use-strings'

type SessionState =
  | { status: 'loading' }
  | { status: 'authenticated'; user: SessionUser }
  | { status: 'unauthenticated' }

type AuthActionResult = { ok: true } | { ok: false; message: string }

type RegisterResult =
  | { ok: true; message: string; requiresEmailConfirmation: boolean }
  | { ok: false; message: string; field?: RegisterConflictField }

type SessionContextValue = {
  session: SessionState
  login: (credentials: LoginRequest) => Promise<AuthActionResult>
  loginWithTokens: (tokens: CallbackRequest) => Promise<AuthActionResult>
  register: (fields: RegisterRequest) => Promise<RegisterResult>
  logout: () => Promise<void>
  refresh: () => Promise<SessionState>
}

const SessionContext = createContext<SessionContextValue | null>(null)

/**
 * Sign-in copy, which is the one place the API's own wording is shown: the
 * auth routes pass Supabase's message through for a rejected sign-in
 * ("Invalid login credentials", "Email not confirmed", a weak password), and
 * every one of those is a 4xx. A 5xx body is internal — `apiFetchRequired`
 * throws a 503 naming the endpoint when the API is unreachable — so it falls
 * back to the generic line.
 */
function extractErrorMessage(
  error: unknown,
  strings: ResolvedStrings<typeof UI_STRINGS_PACK>
): string {
  if (!(error instanceof ApiError)) return strings.general.unexpectedError
  return error.status < 500 ? error.message : strings.general.apiUnavailable
}

/** The unique field a register `409` names, if the error is one. */
function getConflictField(error: unknown): RegisterConflictField | undefined {
  if (!(error instanceof ApiError)) return undefined
  return error.field === 'username' || error.field === 'email'
    ? error.field
    : undefined
}

/**
 * Module-level (not a closure over component state) so the mount effect
 * below can call it without pulling `refresh` into its dependency array
 * — it only ever receives `setSession`, whose identity React guarantees
 * is stable.
 *
 * `previous` is the state to fall back on when the request itself fails.
 */
async function fetchSession(
  setSession: (state: SessionState) => void,
  previous: SessionState
): Promise<SessionState> {
  try {
    const result = await getSession()
    const state: SessionState = result?.user
      ? { status: 'authenticated', user: result.user }
      : { status: 'unauthenticated' }
    setSession(state)
    return state
  } catch {
    // GET /session answers `{ user: null }` for a signed-out visitor, so a
    // throw means the request failed (network, or the API/auth service is
    // down) and says nothing about whether the user is signed in. Keep an
    // already-authenticated session; only an unknown one falls back to
    // signed out.
    const state: SessionState =
      previous.status === 'authenticated'
        ? previous
        : { status: 'unauthenticated' }
    setSession(state)
    return state
  }
}

/** Shared by login and loginWithTokens — both call a backend endpoint
 * that returns { user: SessionUser } on success and only differ in
 * which endpoint/payload gets there. */
async function applySessionResult(
  request: () => Promise<{ user: SessionUser }>,
  setSession: (state: SessionState) => void,
  strings: ResolvedStrings<typeof UI_STRINGS_PACK>
): Promise<AuthActionResult> {
  try {
    const result = await request()
    setSession({ status: 'authenticated', user: result.user })
    return { ok: true }
  } catch (error) {
    return { ok: false, message: extractErrorMessage(error, strings) }
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const strings = useStrings(UI_STRINGS_PACK)
  const router = useRouter()
  const [session, setSession] = useState<SessionState>({ status: 'loading' })

  useEffect(() => {
    fetchSession(setSession, { status: 'loading' })
  }, [])

  /**
   * Server Components read the session cookie themselves, so a client-side
   * sign-in/sign-out leaves them stale until the route is re-rendered (script
   * lists, the profile header, anything gated on being signed in). Every
   * transition goes through this, whether it came from the auth modal or the
   * `/auth` page.
   */
  const refreshServerState = () => router.refresh()

  const refresh = () => fetchSession(setSession, session)

  const login = async (
    credentials: LoginRequest
  ): Promise<AuthActionResult> => {
    const result = await applySessionResult(
      () => loginUser(credentials),
      setSession,
      strings
    )
    if (result.ok) refreshServerState()
    return result
  }

  const loginWithTokens = async (
    tokens: CallbackRequest
  ): Promise<AuthActionResult> => {
    const result = await applySessionResult(
      () => completeAuthCallback(tokens),
      setSession,
      strings
    )
    if (result.ok) refreshServerState()
    return result
  }

  const register = async (fields: RegisterRequest): Promise<RegisterResult> => {
    try {
      const result = await registerUser(fields)
      // `session` is null when Supabase requires email confirmation
      // before the account is active — surface that instead of assuming
      // the user is now logged in.
      const requiresEmailConfirmation = result.session == null
      if (!requiresEmailConfirmation) {
        await refresh()
        refreshServerState()
      }
      return { ok: true, message: result.message, requiresEmailConfirmation }
    } catch (error) {
      return {
        ok: false,
        message: extractErrorMessage(error, strings),
        field: getConflictField(error),
      }
    }
  }

  const logout = async () => {
    try {
      await logoutUser()
    } finally {
      // Clear client state even on a failed request — staying "logged
      // in" in the UI after a failed logout is worse than optimistically
      // clearing it (a stale cookie just makes the next request 401).
      clearAccountState()
      setSession({ status: 'unauthenticated' })
      refreshServerState()
    }
  }

  return (
    <SessionContext.Provider
      value={{ session, login, loginWithTokens, register, logout, refresh }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}
