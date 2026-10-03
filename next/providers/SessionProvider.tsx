'use client'

import type {
  CallbackRequest,
  LoginRequest,
  RegisterRequest,
  SessionUser,
} from '@shared/types/auth.types'
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'
import {
  completeAuthCallback,
  getSession,
  loginUser,
  logoutUser,
  registerUser,
} from '@/lib/api/auth-api'
import { ApiError } from '@/lib/api/next-api'

type SessionState =
  | { status: 'loading' }
  | { status: 'authenticated'; user: SessionUser }
  | { status: 'unauthenticated' }

type AuthActionResult = { ok: true } | { ok: false; message: string }

type RegisterResult =
  | { ok: true; message: string; requiresEmailConfirmation: boolean }
  | { ok: false; message: string }

type SessionContextValue = {
  session: SessionState
  login: (credentials: LoginRequest) => Promise<AuthActionResult>
  loginWithTokens: (tokens: CallbackRequest) => Promise<AuthActionResult>
  register: (fields: RegisterRequest) => Promise<RegisterResult>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)

function extractErrorMessage(error: unknown): string {
  return error instanceof ApiError || error instanceof Error
    ? error.message
    : 'Something went wrong'
}

/**
 * Module-level (not a closure over component state) so the mount effect
 * below can call it without pulling `refresh` into its dependency array
 * — it only ever receives `setSession`, whose identity React guarantees
 * is stable.
 */
async function fetchSession(setSession: (state: SessionState) => void) {
  try {
    const result = await getSession()
    setSession(
      result.user
        ? { status: 'authenticated', user: result.user }
        : { status: 'unauthenticated' }
    )
  } catch {
    // GET /session never throws on the backend — it catches internally
    // and returns `{ user: null }` — so this only fires on a genuine
    // network failure. Treated as logged-out either way.
    setSession({ status: 'unauthenticated' })
  }
}

/** Shared by login and loginWithTokens — both call a backend endpoint
 * that returns { user: SessionUser } on success and only differ in
 * which endpoint/payload gets there. */
async function applySessionResult(
  request: () => Promise<{ user: SessionUser }>,
  setSession: (state: SessionState) => void
): Promise<AuthActionResult> {
  try {
    const result = await request()
    setSession({ status: 'authenticated', user: result.user })
    return { ok: true }
  } catch (error) {
    return { ok: false, message: extractErrorMessage(error) }
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>({ status: 'loading' })

  useEffect(() => {
    fetchSession(setSession)
  }, [])

  const refresh = () => fetchSession(setSession)

  const login = async (
    credentials: LoginRequest
  ): Promise<AuthActionResult> => {
    return applySessionResult(() => loginUser(credentials), setSession)
  }

  const loginWithTokens = async (
    tokens: CallbackRequest
  ): Promise<AuthActionResult> => {
    return applySessionResult(() => completeAuthCallback(tokens), setSession)
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
      }
      return { ok: true, message: result.message, requiresEmailConfirmation }
    } catch (error) {
      return { ok: false, message: extractErrorMessage(error) }
    }
  }

  const logout = async () => {
    try {
      await logoutUser()
    } finally {
      // Clear client state even on a failed request — staying "logged
      // in" in the UI after a failed logout is worse than optimistically
      // clearing it (a stale cookie just makes the next request 401).
      setSession({ status: 'unauthenticated' })
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
