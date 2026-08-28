import { Hono } from 'hono'
import { authMiddleware, createSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const professors = new Hono<HonoEnv>()

/** Get all professors */
professors.get('/', async (c) => {
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('professors')
    .select(`
      *,
      subjects:subject_professors(
        subject:subjects(*)
      )
    `)
    .order('name', { ascending: true })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

/** Get a single professor by ID */
professors.get('/:id', async (c) => {
  const professorId = c.req.param('id')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('professors')
    .select(`
      *,
      subjects:subject_professors(
        subject:subjects(*)
      ),
      comments:comments(
        *,
        author:profiles(username, full_name)
      )
    `)
    .eq('id', professorId)
    .single()

  if (error) return c.json({ error: error.message }, 404)
  return c.json(data)
})

/** Create a new professor (moderator only) */
professors.post('/', authMiddleware, async (c) => {
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

  const { name, picture_url, bio } = await c.req.json()

  if (!name) {
    return c.json({ error: 'Name is required' }, 400)
  }

  const { data, error } = await supabase
    .from('professors')
    .insert({
      name,
      picture_url,
      bio,
    })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, professor: data })
})

/** Update a professor (moderator only) */
professors.patch('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const professorId = c.req.param('id')
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

  const { name, picture_url, bio } = await c.req.json()

  const { data, error } = await supabase
    .from('professors')
    .update({
      name,
      picture_url,
      bio,
    })
    .eq('id', professorId)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, professor: data })
})

/** Delete a professor (moderator only) */
professors.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const professorId = c.req.param('id')
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

  const { error } = await supabase
    .from('professors')
    .delete()
    .eq('id', professorId)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, message: 'Professor deleted successfully' })
})

export default professors
