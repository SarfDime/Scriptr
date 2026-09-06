import { Hono } from 'hono'
import {
  isProfileSubjectStatus,
  isUserRole,
} from '../../../shared/utils/api.utils'
import { authMiddleware, createSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const auth = new Hono<HonoEnv>()

// Register a new user
auth.post('/register', async (c) => {
  const { email, password, username, full_name } = await c.req.json()

  if (!email || !password || !username || !full_name) {
    return c.json(
      { error: 'Email, password, username, and full name are required' },
      400
    )
  }

  const supabase = createSupabaseClient(c)

  // Sign up using Supabase client (your suggested approach)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        full_name: full_name || '',
      },
    },
  })

  if (error) {
    return c.json({ error: error.message }, 400)
  }

  // The profile will be created automatically by our database trigger
  return c.json({
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
  return c.json({
    success: true,
    user: data.user,
    session: data.session,
  })
})

// Logout user
auth.post('/logout', authMiddleware, async (c) => {
  const supabase = createSupabaseClient(c)

  // Logout using Supabase client (your suggested approach)
  const { error } = await supabase.auth.signOut()

  if (error) {
    // biome-ignore lint/suspicious/noConsole: <Good to log>
    console.error('Logout error:', error)
  }

  return c.json({
    success: true,
    message: 'Logged out successfully',
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
      return c.json({ user: null, session: null })
    }

    const [
      { data: profile },
      { data: profileSubjects },
      { data: facultySelections },
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('username, role')
        .eq('id', session.user.id)
        .single(),
      supabase
        .from('profile_subjects')
        .select('subject_id, status')
        .eq('profile_id', session.user.id),
      supabase
        .from('profile_faculties')
        .select('faculty_id')
        .eq('profile_id', session.user.id),
    ])

    return c.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        username: profile?.username || session.user.user_metadata?.username,
        role: isUserRole(profile?.role) ? profile.role : 'student',
        subjects:
          profileSubjects?.flatMap(({ subject_id, status }) =>
            isProfileSubjectStatus(status) ? [{ subject_id, status }] : []
          ) || [],
        selected_faculty_ids:
          facultySelections?.map(({ faculty_id }) => faculty_id) || [],
      },
    })
  } catch (_error) {
    return c.json({ user: null, session: null })
  }
})

// Refresh session
auth.post('/refresh', async (c) => {
  const { refresh_token } = await c.req.json()

  if (!refresh_token) {
    return c.json({ error: 'Refresh token required' }, 400)
  }

  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token,
  })

  if (error || !data.session) {
    return c.json({ error: 'Invalid refresh token' }, 401)
  }

  return c.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
  })
})

export default auth
