import { Hono } from 'hono'
import { isAdmin } from '../../../shared/utils/api.utils'
import { requiredParam } from '../lib/request'
import { authMiddleware, createSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

// profile_achievements replaced the old profiles.achievements jsonb column.
const PROFILE_ACHIEVEMENTS_SELECT =
  'achievements:profile_achievements(achievement_id, earned_at, achievement:achievement_definitions(title, description, metric, threshold))'

function validateUsername(username: unknown): string | null {
  if (!username) return null
  if (
    typeof username !== 'string' ||
    username.length < 3 ||
    username.length > 30
  ) {
    return 'Username must be between 3 and 30 characters'
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return 'Username can only contain letters, numbers, hyphens, and underscores'
  }
  return null
}

async function syncFacultyAndStudySelections(
  supabase: ReturnType<typeof createSupabaseClient>,
  profileId: string,
  selectedFacultyIds: unknown,
  selectedStudyIds: unknown
) {
  if (Array.isArray(selectedFacultyIds)) {
    await supabase
      .from('profile_faculties')
      .delete()
      .eq('profile_id', profileId)

    if (selectedFacultyIds.length > 0) {
      await supabase.from('profile_faculties').insert(
        selectedFacultyIds.map((facultyId: string) => ({
          profile_id: profileId,
          faculty_id: facultyId,
        }))
      )
    }
  }

  if (Array.isArray(selectedStudyIds)) {
    await supabase.from('profile_studies').delete().eq('profile_id', profileId)

    if (selectedStudyIds.length > 0) {
      await supabase.from('profile_studies').insert(
        selectedStudyIds.map((studyId: string) => ({
          profile_id: profileId,
          study_id: studyId,
        }))
      )
    }
  }
}

const profiles = new Hono<HonoEnv>()

/** Get all profiles (public) */
profiles.get('/', async (c) => {
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('profiles')
    .select(
      `id, username, full_name, role, ${PROFILE_ACHIEVEMENTS_SELECT}, avatar_url, created_at, subjects:profile_subjects(subject_id, status, updated_at)`
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
      '*, subjects:profile_subjects(subject_id, status, updated_at), selected_faculties:profile_faculties(faculty:faculties(*, university:universities(id, name))), selected_studies:profile_studies(study:studies(*, faculty:faculties(*, university:universities(id, name))))'
    )
    .eq('id', user.id)
    .single()

  if (error) return c.json({ error: error.message }, 404)
  return c.json(data)
})

/** Delete current user's profile */
profiles.delete('/me', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  const { error } = await supabase.from('profiles').delete().eq('id', user.id)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
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
        ${PROFILE_ACHIEVEMENTS_SELECT},
        subjects:profile_subjects(subject_id, status, updated_at),
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
        ${PROFILE_ACHIEVEMENTS_SELECT},
        subjects:profile_subjects(subject_id, status, updated_at),
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

  const { username, full_name, selected_faculty_ids, selected_study_ids } =
    await c.req.json()

  const usernameError = validateUsername(username)
  if (usernameError) return c.json({ error: usernameError }, 400)

  const { data, error } = await supabase
    .from('profiles')
    .update({ username, full_name })
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return c.json({ error: 'Username already taken' }, 400)
    }
    return c.json({ error: error.message }, 500)
  }

  await syncFacultyAndStudySelections(
    supabase,
    user.id,
    selected_faculty_ids,
    selected_study_ids
  )

  return c.json({ success: true, profile: data })
})

/** Update any user's profile (admin only) */
profiles.patch('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const targetId = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAdmin(profile?.role)) {
    return c.json({ error: 'Unauthorized: Admin access required' }, 403)
  }

  const { username, full_name, selected_faculty_ids, selected_study_ids } =
    await c.req.json()

  const usernameError = validateUsername(username)
  if (usernameError) return c.json({ error: usernameError }, 400)

  const { data, error } = await supabase
    .from('profiles')
    .update({ username, full_name })
    .eq('id', targetId)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return c.json({ error: 'Username already taken' }, 400)
    }
    return c.json({ error: error.message }, 500)
  }

  await syncFacultyAndStudySelections(
    supabase,
    targetId,
    selected_faculty_ids,
    selected_study_ids
  )

  return c.json({ success: true, profile: data })
})

/** Delete any user's profile (admin only) */
profiles.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const targetId = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAdmin(profile?.role)) {
    return c.json({ error: 'Unauthorized: Admin access required' }, 403)
  }

  const { error } = await supabase.from('profiles').delete().eq('id', targetId)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

/** Get user statistics */
profiles.get('/:id/stats', async (c) => {
  const userId = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)

  const { count: scriptsCount } = await supabase
    .from('scripts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', userId)

  const { data: scripts } = await supabase
    .from('scripts')
    .select('vote_score')
    .eq('author_id', userId)

  const totalVotes =
    scripts?.reduce((sum, script) => sum + (script.vote_score || 0), 0) || 0

  const { data: downloadData } = await supabase
    .from('scripts')
    .select('download_count')
    .eq('author_id', userId)

  const totalDownloads =
    downloadData?.reduce(
      (sum, script) => sum + (script.download_count || 0),
      0
    ) || 0

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
