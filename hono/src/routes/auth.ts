import type { User } from '@supabase/supabase-js'
import { Hono } from 'hono'
import type {
  CallbackResponse,
  LoginResponse,
  LogoutResponse,
  RegisterResponse,
  RegistrationAcademicProfile,
  SessionResponse,
  SessionUser,
} from '../../../shared/types/auth.types'
import {
  isProfileSubjectStatus,
  isUserRole,
} from '../../../shared/utils/api.utils'
import { honoLog } from '../lib/logger'
import {
  authMiddleware,
  createInternalSupabaseClient,
  createSupabaseClient,
} from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const auth = new Hono<HonoEnv>()

const isRegistrationAcademicProfile = (
  value: unknown
): value is RegistrationAcademicProfile => {
  if (!value || typeof value !== 'object') return false
  const profile = value as Record<string, unknown>
  return (
    typeof profile.facultyId === 'string' &&
    profile.facultyId.length > 0 &&
    (profile.studyId === null ||
      (typeof profile.studyId === 'string' && profile.studyId.length > 0)) &&
    Array.isArray(profile.completedSubjectIds) &&
    profile.completedSubjectIds.every(
      (subjectId) => typeof subjectId === 'string' && subjectId.length > 0
    )
  )
}

async function bootstrapAcademicProfile(
  c: Parameters<typeof createInternalSupabaseClient>[0],
  profileId: string,
  academicProfile: RegistrationAcademicProfile
) {
  const supabase = createInternalSupabaseClient(c)
  const { data: faculty, error: facultyError } = await supabase
    .from('faculties')
    .select('id')
    .eq('id', academicProfile.facultyId)
    .maybeSingle()

  if (facultyError || !faculty) {
    throw new Error('The selected faculty is invalid')
  }

  if (academicProfile.studyId) {
    const { data: study, error: studyError } = await supabase
      .from('studies')
      .select('id, faculty_id')
      .eq('id', academicProfile.studyId)
      .maybeSingle()

    if (
      studyError ||
      !study ||
      study.faculty_id !== academicProfile.facultyId
    ) {
      throw new Error('The selected study is invalid')
    }
  }

  if (academicProfile.completedSubjectIds.length > 0) {
    if (!academicProfile.studyId) {
      throw new Error('Completed subjects require a selected study')
    }

    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('id, study_id')
      .in('id', academicProfile.completedSubjectIds)

    if (
      subjectsError ||
      subjects.length !== academicProfile.completedSubjectIds.length ||
      subjects.some((subject) => subject.study_id !== academicProfile.studyId)
    ) {
      throw new Error('One or more selected subjects are invalid')
    }
  }

  const { error: facultyInsertError } = await supabase
    .from('profile_faculties')
    .upsert(
      { profile_id: profileId, faculty_id: academicProfile.facultyId },
      { onConflict: 'profile_id,faculty_id' }
    )

  if (facultyInsertError) throw facultyInsertError

  if (academicProfile.studyId) {
    const { error: studyInsertError } = await supabase
      .from('profile_studies')
      .upsert(
        { profile_id: profileId, study_id: academicProfile.studyId },
        { onConflict: 'profile_id,study_id' }
      )

    if (studyInsertError) throw studyInsertError
  }

  if (academicProfile.completedSubjectIds.length > 0) {
    const { error: subjectsInsertError } = await supabase
      .from('profile_subjects')
      .upsert(
        academicProfile.completedSubjectIds.map((subjectId) => ({
          profile_id: profileId,
          subject_id: subjectId,
          status: 'completed' as const,
        })),
        { onConflict: 'profile_id,subject_id' }
      )

    if (subjectsInsertError) throw subjectsInsertError
  }
}

type SupabaseInstance = ReturnType<typeof createSupabaseClient>

/**
 * Shared by /login and /session — both need the same app-shaped user
 * (username/role/subjects/faculty & study selections), not Supabase's
 * raw auth user. Previously duplicated inline in /session only; /login
 * returned `data.user` unmodified, which is why the Next client used to
 * have to refetch /session right after logging in.
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
  ])

  return {
    id: user.id,
    email: user.email,
    username: profile?.username || user.user_metadata?.username,
    role: isUserRole(profile?.role) ? profile.role : 'student',
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
    academicProfile?: unknown
  }>()
  const { email, password, username, full_name, academicProfile } = body

  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    typeof username !== 'string' ||
    typeof full_name !== 'string'
  ) {
    return c.json(
      { error: 'Email, password, username, and full name are required' },
      400
    )
  }

  if (
    academicProfile !== undefined &&
    !isRegistrationAcademicProfile(academicProfile)
  ) {
    return c.json({ error: 'Invalid academic profile' }, 400)
  }

  const supabase = createSupabaseClient(c)

  const origin = c.req.header('origin')

  // Sign up using Supabase client (your suggested approach)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        full_name: full_name || '',
      },
      ...(origin ? { emailRedirectTo: `${origin}/auth/callback` } : {}),
    },
  })

  if (error) {
    return c.json({ error: error.message }, 400)
  }

  if (data.user?.id && academicProfile) {
    try {
      await bootstrapAcademicProfile(c, data.user.id, academicProfile)
    } catch (bootstrapError) {
      honoLog({
        message: 'Registration academic profile bootstrap failed',
        logLevel: 'error',
        error: bootstrapError,
      })
      const { error: cleanupError } = await createInternalSupabaseClient(
        c
      ).auth.admin.deleteUser(data.user.id)
      if (cleanupError) {
        honoLog({
          message:
            'Failed to roll back account after profile bootstrap failure',
          logLevel: 'error',
          error: cleanupError,
        })
      }
      return c.json(
        {
          error: 'Account created, but the academic profile could not be saved',
        },
        500
      )
    }
  }

  // The profile will be created automatically by our database trigger
  return c.json<RegisterResponse>({
    success: true,
    message:
      data.user?.identities?.length === 0
        ? 'User already exists'
        : 'Registration successful. Please check your email.',
    user: {
      id: data.user?.id,
      email: data.user?.email,
      username,
    },
    session: data.session,
  })
})

/** Sign in with email and password */
auth.post('/login', async (c) => {
  const { email, password } = await c.req.json()
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
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

// Get current session from cookies
auth.get('/session', async (c) => {
  const supabase = createSupabaseClient(c)

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error || !session) {
      return c.json<SessionResponse>({ user: null, session: null })
    }

    return c.json<SessionResponse>({
      user: await buildSessionUser(supabase, session.user),
    })
  } catch (_error) {
    return c.json<SessionResponse>({ user: null, session: null })
  }
})

export default auth
