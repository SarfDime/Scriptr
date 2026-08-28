import { Hono } from 'hono'
import { authMiddleware, createSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const scripts = new Hono<HonoEnv>()

/** Get all scripts (public) */
scripts.get('/', async (c) => {
  const supabase = createSupabaseClient(c)
  const { data, error } = await supabase
    .from('scripts')
    .select(`
      *,
      author:profiles(username, full_name),
      subject:subjects(name, year, exam_session)
    `)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

/** Get scripts by subject */
scripts.get('/subject/:subjectId', async (c) => {
  const subjectId = c.req.param('subjectId')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('scripts')
    .select(`
      *,
      author:profiles(username, full_name),
      subject:subjects(name, year, exam_session)
    `)
    .eq('subject_id', subjectId)
    .order('vote_score', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

/** Get top scripts (by vote score) */
scripts.get('/top', async (c) => {
  const limit = parseInt(c.req.query('limit') || '10', 10)
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('scripts')
    .select(`
      *,
      author:profiles(username, full_name),
      subject:subjects(name, year)
    `)
    .order('vote_score', { ascending: false })
    .limit(limit)

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

/** Get most downloaded scripts */
scripts.get('/popular', async (c) => {
  const limit = parseInt(c.req.query('limit') || '10', 10)
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('scripts')
    .select(`
      *,
      author:profiles(username, full_name),
      subject:subjects(name, year)
    `)
    .order('download_count', { ascending: false })
    .limit(limit)

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

/** Get a single script by ID */
scripts.get('/:id', async (c) => {
  const scriptId = c.req.param('id')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('scripts')
    .select(`
      *,
      author:profiles(username, full_name, id),
      subject:subjects(name, year, exam_session)
    `)
    .eq('id', scriptId)
    .single()

  if (error) return c.json({ error: error.message }, 404)
  return c.json(data)
})

/** Search scripts */
scripts.get('/search', async (c) => {
  const query = c.req.query('q')
  const supabase = createSupabaseClient(c)

  if (!query) {
    return c.json({ error: 'Search query is required' }, 400)
  }

  const { data, error } = await supabase
    .from('scripts')
    .select(`
      *,
      author:profiles(username, full_name),
      subject:subjects(name, year)
    `)
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .order('vote_score', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

/** Insert a new script */
scripts.post('/', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  const { title, description, fileKey, subjectId, fileType } =
    await c.req.json()

  if (!title || !subjectId || !fileKey || !fileType) {
    return c.json({ error: 'Missing required fields' }, 400)
  }

  const { data, error } = await supabase
    .from('scripts')
    .insert({
      title,
      description: description || '',
      file_url: fileKey,
      file_type: fileType || 'pdf',
      subject_id: subjectId,
      author_id: user.id,
      vote_score: 0,
      download_count: 0,
    })
    .select(`
      *,
      author:profiles(username, full_name),
      subject:subjects(name, year)
    `)
    .single()

  if (error) {
    return c.json({ error: 'Failed to save script record' }, 500)
  }

  return c.json({
    success: true,
    script: data,
    message: 'Script uploaded successfully',
  })
})

/** Update a script (only by author or moderator) */
scripts.patch('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const scriptId = c.req.param('id')
  const supabase = createSupabaseClient(c)

  const { title, description } = await c.req.json()

  // Get the script and user's role
  const [{ data: script }, { data: profile }] = await Promise.all([
    supabase.from('scripts').select('author_id').eq('id', scriptId).single(),
    supabase.from('profiles').select('role').eq('id', user.id).single(),
  ])

  // Check if user is author or moderator
  if (script?.author_id !== user.id && profile?.role !== 'moderator') {
    return c.json(
      { error: 'Unauthorized: You can only edit your own scripts' },
      403
    )
  }

  const { data, error } = await supabase
    .from('scripts')
    .update({
      title,
      description,
      updated_at: new Date().toISOString(),
    })
    .eq('id', scriptId)
    .select(`
      *,
      author:profiles(username, full_name),
      subject:subjects(name, year)
    `)
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, script: data })
})

/** Delete a script (only by author or moderator) */
scripts.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const scriptId = c.req.param('id')
  const supabase = createSupabaseClient(c)

  // Get the script and user's role
  const [{ data: script }, { data: profile }] = await Promise.all([
    supabase
      .from('scripts')
      .select('author_id, file_url')
      .eq('id', scriptId)
      .single(),
    supabase.from('profiles').select('role').eq('id', user.id).single(),
  ])

  // Check if user is author or moderator
  if (script?.author_id !== user.id && profile?.role !== 'moderator') {
    return c.json(
      { error: 'Unauthorized: You can only delete your own scripts' },
      403
    )
  }

  const { error } = await supabase.from('scripts').delete().eq('id', scriptId)

  if (error) return c.json({ error: error.message }, 500)

  // Note: You might want to also delete the actual file from storage here
  // Example: await supabase.storage.from('scripts').remove([script.file_url])

  return c.json({ success: true, message: 'Script deleted successfully' })
})

/** Get all scripts for a user */
scripts.get('/my-scripts', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('scripts')
    .select(`
      *,
      subject:subjects(name, year)
    `)
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ scripts: data })
})

/** Increment download count */
scripts.post('/:id/download', async (c) => {
  const scriptId = c.req.param('id')
  const supabase = createSupabaseClient(c)

  const { data: script } = await supabase
    .from('scripts')
    .select('download_count')
    .eq('id', scriptId)
    .single()

  if (!script) {
    return c.json({ error: 'Script not found' }, 404)
  }

  const { error } = await supabase
    .from('scripts')
    .update({ download_count: (script.download_count || 0) + 1 })
    .eq('id', scriptId)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

/** Get flagged scripts (moderator only) */
scripts.get('/flagged/all', authMiddleware, async (c) => {
  const user = c.get('user')
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

  const { data, error } = await supabase
    .from('scripts')
    .select(`
      *,
      author:profiles(username, full_name),
      subject:subjects(name, year),
      flags:flags(
        *,
        reporter:profiles!reporter_id(username)
      )
    `)
    .eq('is_flagged', true)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

export default scripts
