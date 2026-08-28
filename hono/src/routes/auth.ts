import { Hono } from 'hono'
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
  // TODO: See if needed
  const supabase = createSupabaseClient(c)

  try {
    // Get session from cookies (automatic)
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error || !session) {
      return c.json({ user: null, session: null })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, role')
      .eq('id', session.user.id)
      .single()

    const { data: completedSubjects } = await supabase
      .from('profile_completed_subjects')
      .select('subject_id')
      .eq('profile_id', session.user.id)

    return c.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        username: profile?.username || session.user.user_metadata?.username,
        role: profile?.role || 'student',
        completed_subject_ids:
          completedSubjects?.map(({ subject_id }) => subject_id) || [],
      },
    })
  } catch (_error) {
    return c.json({ user: null, session: null })
  }
})

// Refresh session (optional)
auth.post('/refresh', async (c) => {
  // TODO: See if needed

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
