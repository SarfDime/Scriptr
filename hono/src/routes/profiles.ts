import { Hono } from 'hono'
import { requiredParam } from '../lib/request'
import { authMiddleware, createSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const profiles = new Hono<HonoEnv>()

/** Get all profiles (public) */
profiles.get('/', async (c) => {
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, username, full_name, role, achievements, avatar_url, created_at, profile_completed_subjects(subject_id, passed_at)'
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
    .select(
      '*, completed_subjects:profile_completed_subjects(subject_id, passed_at), selected_faculties:profile_faculties(faculty:faculties(*, university:universities(id, name)))'
    )
    .eq('id', user.id)
    .single()

  if (error) return c.json({ error: error.message }, 404)
  return c.json(data)
})

/** Get a specific user profile by username */
profiles.get('/username/:username', async (c) => {
  const username = requiredParam(c, 'username')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      username,
      full_name,
      role,
      achievements,
      completed_subjects:profile_completed_subjects(subject_id, passed_at),
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
  const userId = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      username,
      full_name,
      role,
      achievements,
      completed_subjects:profile_completed_subjects(subject_id, passed_at),
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

  const { username, full_name, completed_subject_ids, selected_faculty_ids } =
    await c.req.json()

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

  if (Array.isArray(completed_subject_ids)) {
    await supabase
      .from('profile_completed_subjects')
      .delete()
      .eq('profile_id', user.id)

    if (completed_subject_ids.length > 0) {
      await supabase.from('profile_completed_subjects').insert(
        completed_subject_ids.map((subjectId: string) => ({
          profile_id: user.id,
          subject_id: subjectId,
        }))
      )
    }
  }

  if (Array.isArray(selected_faculty_ids)) {
    await supabase.from('profile_faculties').delete().eq('profile_id', user.id)

    if (selected_faculty_ids.length > 0) {
      await supabase.from('profile_faculties').insert(
        selected_faculty_ids.map((facultyId: string) => ({
          profile_id: user.id,
          faculty_id: facultyId,
        }))
      )
    }
  }

  return c.json({ success: true, profile: data })
})

/** Get user statistics */
profiles.get('/:id/stats', async (c) => {
  const userId = requiredParam(c, 'id')
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
