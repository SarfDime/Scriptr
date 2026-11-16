import {
  type AuthError,
  isAuthRetryableFetchError,
  type Session,
  type User,
} from '@supabase/supabase-js'
import { Hono } from 'hono'
import type {
  CallbackResponse,
  LoginResponse,
  LogoutResponse,
  RegisterConflictResponse,
  RegisterResponse,
  SessionResponse,
  SessionUser,
} from '../../../shared/types/auth.types'
import {
  isProfileSubjectStatus,
  isStudyRole,
  isUserRole,
  validateEmailAddress,
  validateUsername,
} from '../../../shared/utils/api.utils'
import { createRateLimiter } from '../../../shared/utils/rate-limit'
import { honoLog } from '../lib/logger'
import {
  authMiddleware,
  createInternalSupabaseClient,
  createSupabaseClient,
} from '../lib/supabase'
import { isUsernameTaken } from '../lib/username'
import type { HonoEnv } from '../types/env.types'

const auth = new Hono<HonoEnv>()

/** A failure of the auth service itself (network error, 5xx), as opposed to a
 * bad or expired token. These must neither sign the user out nor be reported
 * as "signed out". */
const isTransientAuthError = (error: AuthError) =>
  isAuthRetryableFetchError(error) || (error.status ?? 0) >= 500

const authRateLimiter = createRateLimiter({
  limit: 10,
  windowMs: 15 * 60 * 1000,
  // Attempts over the limit still count, so hammering keeps the block in place.
  countBlocked: true,
})

function applyAuthRateLimit(
  c: Parameters<typeof createSupabaseClient>[0],
  route: 'register' | 'login'
) {
  const forwardedFor = c.req.header('x-forwarded-for')
  const clientIp =
    forwardedFor?.split(',')[0]?.trim() ||
    c.req.header('x-real-ip') ||
    'unknown-ip'
  return authRateLimiter(`${route}:${clientIp}`)
}

async function ensureProfile(
  c: Parameters<typeof createInternalSupabaseClient>[0],
  profileId: string,
  username: string,
  fullName: string
) {
  const { error } = await createInternalSupabaseClient(c)
    .from('profiles')
    .upsert(
      { id: profileId, username, full_name: fullName },
      { onConflict: 'id' }
    )

  if (error) throw error
}

async function rollbackRegistrationUser(
  c: Parameters<typeof createInternalSupabaseClient>[0],
  userId: string
) {
  const { error } =
    await createInternalSupabaseClient(c).auth.admin.deleteUser(userId)
  if (error) {
    honoLog({
      message: 'Failed to roll back account after registration failure',
      logLevel: 'error',
      error,
    })
  }
}

type SupabaseInstance = ReturnType<typeof createSupabaseClient>

/**
 * Shared by /login and /session — both need the same app-shaped user
 * (username/role/subjects/faculty & study selections), not Supabase's
 * raw auth user.
 */
async function buildSessionUser(
  supabase: SupabaseInstance,
  user: User
): Promise<SessionUser> {
  const [
    { data: profile },
    { data: profileSubjects },
    { data: facultySelections },
    { data: studySelections },
    { data: studyRoles },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('username, role')
      .eq('id', user.id)
      .single(),
    supabase
      .from('profile_subjects')
      .select('subject_id, status')
      .eq('profile_id', user.id),
    supabase
      .from('profile_faculties')
      .select('faculty_id')
      .eq('profile_id', user.id),
    supabase
      .from('profile_studies')
      .select('study_id')
      .eq('profile_id', user.id),
    supabase
      .from('study_roles')
      .select('study_id, role')
      .eq('profile_id', user.id),
  ])

  return {
    id: user.id,
    email: user.email,
    username: profile?.username || user.user_metadata?.username,
    role: isUserRole(profile?.role) ? profile.role : 'student',
    study_roles:
      studyRoles?.flatMap(({ study_id, role }) =>
        isStudyRole(role) ? [{ study_id, role }] : []
      ) || [],
    subjects:
      profileSubjects?.flatMap(({ subject_id, status }) =>
        isProfileSubjectStatus(status) ? [{ subject_id, status }] : []
      ) || [],
    selected_faculty_ids:
      facultySelections?.map(({ faculty_id }) => faculty_id) || [],
    selected_study_ids: studySelections?.map(({ study_id }) => study_id) || [],
  }
}

// Register a new user
auth.post('/register', async (c) => {
  const body = await c.req.json<{
    email?: unknown
    password?: unknown
    username?: unknown
    full_name?: unknown
  }>()
  const { email, password, username, full_name } = body

  if (applyAuthRateLimit(c, 'register')) {
    return c.json(
      {
        error:
          'Too many registration attempts. Please wait a moment and try again.',
      },
      429
    )
  }

  if (
    typeof password !== 'string' ||
    typeof email !== 'string' ||
    typeof username !== 'string' ||
    typeof full_name !== 'string'
  ) {
    return c.json(
      { error: 'Email, password, username, and full name are required' },
      400
    )
  }

  const normalizedEmail = email.trim()
  const normalizedUsername = username.trim()
  const normalizedFullName = full_name.trim()

  const emailError = validateEmailAddress(normalizedEmail)
  if (emailError) {
    return c.json({ error: emailError }, 400)
  }

  const usernameError = validateUsername(normalizedUsername)
  if (usernameError) {
    return c.json({ error: usernameError }, 400)
  }

  if (!normalizedFullName) {
    return c.json({ error: 'Full name is required' }, 400)
  }

  const supabase = createSupabaseClient(c)

  const usernameLookup = await isUsernameTaken(supabase, normalizedUsername)

  if (!usernameLookup.ok) {
    return c.json({ error: 'Unable to check username availability' }, 500)
  }

  if (usernameLookup.taken) {
    return c.json<RegisterConflictResponse>(
      { error: 'Username already taken', field: 'username' },
      409
    )
  }

  const origin = c.req.header('origin')

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        username: normalizedUsername,
        full_name: normalizedFullName,
      },
      ...(origin ? { emailRedirectTo: `${origin}/auth/callback` } : {}),
    },
  })

  const emailTaken: RegisterConflictResponse = {
    error: 'An account with this email already exists',
    field: 'email',
  }

  if (error?.code === 'user_already_exists') {
    return c.json<RegisterConflictResponse>(emailTaken, 409)
  }

  if (error) {
    return c.json({ error: error.message }, 400)
  }

  // With email confirmation enabled Supabase hides duplicates: instead of an
  // error it returns an obfuscated user with no identities.
  if (data.user?.identities?.length === 0) {
    return c.json<RegisterConflictResponse>(emailTaken, 409)
  }

  // The academic profile is no longer part of registration: it is per study,
  // written once the account exists through the study-scoped endpoints (see
  // `docs/ARCHITECTURE-USERS-AUTH.md`).
  if (data.user?.id) {
    try {
      await ensureProfile(
        c,
        data.user.id,
        normalizedUsername,
        normalizedFullName
      )
    } catch (profileError) {
      honoLog({
        message: 'Registration profile bootstrap failed',
        logLevel: 'error',
        error: profileError,
      })
      await rollbackRegistrationUser(c, data.user.id)
      return c.json(
        { error: 'Your account could not be completed. Please try again.' },
        500
      )
    }
  }

  // The profile will be created automatically by our database trigger
  return c.json<RegisterResponse>({
    success: true,
    message: 'Registration successful. Please check your email.',
    user: {
      id: data.user?.id,
      email: data.user?.email,
      username: normalizedUsername,
    },
    session: data.session,
  })
})

/** Sign in with email and password */
auth.post('/login', async (c) => {
  const { email, password } = await c.req.json()

  if (applyAuthRateLimit(c, 'login')) {
    return c.json(
      {
        error: 'Too many sign-in attempts. Please wait a moment and try again.',
      },
      429
    )
  }

  if (typeof email !== 'string' || typeof password !== 'string') {
    return c.json({ error: 'Email and password are required' }, 400)
  }

  const emailError = validateEmailAddress(email)
  if (emailError) {
    return c.json({ error: emailError }, 400)
  }

  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })

  if (error) {
    return c.json({ error: error.message }, 401)
  }

  // The cookie is automatically set by Supabase's storage adapter
  return c.json<LoginResponse>({
    success: true,
    user: await buildSessionUser(supabase, data.user),
    session: data.session,
  })
})

// Logout user
auth.post('/logout', authMiddleware, async (c) => {
  const supabase = createSupabaseClient(c)

  // Logout using Supabase client (your suggested approach)
  const { error } = await supabase.auth.signOut()

  if (error) {
    honoLog({ message: 'Logout error', logLevel: 'error', error })
  }

  return c.json<LogoutResponse>({
    success: true,
    message: 'Logged out successfully',
  })
})

/**
 * Establishes a session from tokens handed off by Supabase's own hosted
 * /verify redirect (email confirmation, magic link, invite, ...) — see
 * next/hooks/useAuthCallback.ts, which extracts these from the URL
 * fragment client-side (fragments never reach a server on their own)
 * and posts them here. Confirmed against a real confirmation link that
 * this project uses the implicit flow (#access_token=...), not PKCE, so
 * there's no code_verifier/exchangeCodeForSession concern.
 */
auth.post('/callback', async (c) => {
  const { access_token, refresh_token } = await c.req.json()

  if (!access_token || !refresh_token) {
    return c.json({ error: 'Access token and refresh token required' }, 400)
  }

  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  })

  if (error || !data.user) {
    return c.json({ error: error?.message ?? 'Invalid session tokens' }, 401)
  }

  // The cookie is automatically set by Supabase's storage adapter, same
  // as /login.
  return c.json<CallbackResponse>({
    success: true,
    user: await buildSessionUser(supabase, data.user),
    session: data.session,
  })
})

// Get current session from cookies. A signed-out visitor is a normal `200` with
// `user: null`. If the auth service or database can't be reached the answer is
// unknown, so it is a `503`/`500` and never `user: null`, and the cookie is left
// alone: clients must not treat an outage as being signed out.
auth.get('/session', async (c) => {
  const supabase = createSupabaseClient(c)
  const unavailable = () =>
    c.json({ error: 'Authentication service unavailable' }, 503)

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError && isTransientAuthError(sessionError)) {
      return unavailable()
    }

    if (sessionError || !session) {
      return c.json<SessionResponse>({ user: null, session: null })
    }

    const refreshSession = async (): Promise<
      | { status: 'ok'; session: Session }
      | { status: 'signed-out' }
      | { status: 'unavailable' }
    > => {
      const { data, error } = await supabase.auth.refreshSession()
      if (data.session && !error) return { status: 'ok', session: data.session }
      if (error && isTransientAuthError(error)) return { status: 'unavailable' }

      await supabase.auth.signOut({ scope: 'local' })
      return { status: 'signed-out' }
    }

    let needsRefresh =
      !session.expires_at ||
      session.expires_at <= Math.floor(Date.now() / 1000) + 60

    if (!needsRefresh) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError && isTransientAuthError(userError)) return unavailable()
      needsRefresh = Boolean(userError) || !user
    }

    let activeSession = session
    if (needsRefresh) {
      const refreshed = await refreshSession()
      if (refreshed.status === 'unavailable') return unavailable()
      if (refreshed.status === 'signed-out') {
        return c.json<SessionResponse>({ user: null, session: null })
      }
      activeSession = refreshed.session
    }

    return c.json<SessionResponse>({
      user: await buildSessionUser(supabase, activeSession.user),
    })
  } catch (error) {
    honoLog({
      logLevel: 'error',
      message: 'Failed to resolve the current session',
      error,
    })
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default auth
