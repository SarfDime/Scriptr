import { Hono } from 'hono'
import { authMiddleware, createSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const profiles = new Hono<HonoEnv>()

/** Get all profiles (public) */
profiles.get('/', async (c) => {
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, username, full_name, role, achievements, subjects_passed, created_at'
    )
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

/** Get current user's profile */
profiles.get('/me', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) return c.json({ error: error.message }, 404)
  return c.json(data)
})

/** Get a specific user profile by username */
profiles.get('/username/:username', async (c) => {
  const username = c.req.param('username')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      username,
      full_name,
      role,
      achievements,
      subjects_passed,
      created_at,
      scripts:scripts(
        id,
        title,
        vote_score,
        download_count,
        created_at,
        subject:subjects(name)
      )
    `)
    .eq('username', username)
    .single()

  if (error) return c.json({ error: 'User not found' }, 404)
  return c.json(data)
})

/** Get a specific user profile by ID */
profiles.get('/:id', async (c) => {
  const userId = c.req.param('id')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      username,
      full_name,
      role,
      achievements,
      subjects_passed,
      created_at,
      scripts:scripts(
        id,
        title,
        vote_score,
        download_count,
        created_at,
        subject:subjects(name)
      )
    `)
    .eq('id', userId)
    .single()

  if (error) return c.json({ error: 'User not found' }, 404)
  return c.json(data)
})

/** Update current user's profile */
profiles.patch('/me', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  const { username, full_name, subjects_passed } = await c.req.json()

  // Validate username if provided
  if (username) {
    if (username.length < 3 || username.length > 30) {
      return c.json(
        { error: 'Username must be between 3 and 30 characters' },
        400
      )
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return c.json(
        {
          error:
            'Username can only contain letters, numbers, hyphens, and underscores',
        },
        400
      )
    }
  }

  const updateData = {
    username,
    full_name,
    subjects_passed,
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return c.json({ error: 'Username already taken' }, 400)
    }
    return c.json({ error: error.message }, 500)
  }

  return c.json({ success: true, profile: data })
})

/** Update user role (moderator only) */
profiles.patch('/:id/role', authMiddleware, async (c) => {
  const user = c.get('user')
  const targetUserId = c.req.param('id')
  const supabase = createSupabaseClient(c)

  // Check if user is moderator
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'moderator') {
    return c.json({ error: 'Unauthorized: Moderator access required' }, 403)
  }

  const { role } = await c.req.json()

  if (!['student', 'moderator'].includes(role)) {
    return c.json(
      { error: 'Role must be either "student" or "moderator"' },
      400
    )
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', targetUserId)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, profile: data })
})

/** Get user statistics */
profiles.get('/:id/stats', async (c) => {
  const userId = c.req.param('id')
  const supabase = createSupabaseClient(c)

  // Get user's scripts count
  const { count: scriptsCount } = await supabase
    .from('scripts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', userId)

  // Get total votes received
  const { data: scripts } = await supabase
    .from('scripts')
    .select('vote_score')
    .eq('author_id', userId)

  const totalVotes =
    scripts?.reduce((sum, script) => sum + (script.vote_score || 0), 0) || 0

  // Get total downloads
  const { data: downloadData } = await supabase
    .from('scripts')
    .select('download_count')
    .eq('author_id', userId)

  const totalDownloads =
    downloadData?.reduce(
      (sum, script) => sum + (script.download_count || 0),
      0
    ) || 0

  // Get comments count
  const { count: commentsCount } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', userId)

  return c.json({
    scripts_uploaded: scriptsCount || 0,
    total_votes_received: totalVotes,
    total_downloads: totalDownloads,
    comments_made: commentsCount || 0,
  })
})

export default profiles
