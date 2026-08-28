import { Hono } from 'hono'
import { authMiddleware, createSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const subjects = new Hono<HonoEnv>()

/** Get all subjects */
subjects.get('/', async (c) => {
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('subjects')
    .select(`
      *,
      professors:subject_professors(
        professor:professors(*)
      ),
      scripts:scripts(count)
    `)
    .order('year', { ascending: true })
    .order('name', { ascending: true })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

/** Get subjects by year */
subjects.get('/year/:year', async (c) => {
  const year = c.req.param('year')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('subjects')
    .select(`
      *,
      professors:subject_professors(
        professor:professors(*)
      )
    `)
    .eq('year', Number(year))
    .order('name', { ascending: true })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

/** Get a single subject by ID */
subjects.get('/:id', async (c) => {
  const subjectId = c.req.param('id')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('subjects')
    .select(`
      *,
      professors:subject_professors(
        professor:professors(*)
      ),
      scripts:scripts(
        *,
        author:profiles(username)
      )
    `)
    .eq('id', subjectId)
    .single()

  if (error) return c.json({ error: error.message }, 404)
  return c.json(data)
})

/** Create a new subject (moderator only) */
subjects.post('/', authMiddleware, async (c) => {
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

  const { name, year, exam_session, description, professor_ids } =
    await c.req.json()

  if (!name || !year || !exam_session) {
    return c.json({ error: 'Name, year, and exam_session are required' }, 400)
  }

  const { data, error } = await supabase
    .from('subjects')
    .insert({
      name,
      year,
      exam_session,
      description,
    })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)

  // If professor_ids are provided, create the associations
  if (
    professor_ids &&
    Array.isArray(professor_ids) &&
    professor_ids.length > 0
  ) {
    const associations = professor_ids.map((profId) => ({
      subject_id: data.id,
      professor_id: profId,
    }))

    await supabase.from('subject_professors').insert(associations)
  }

  return c.json({ success: true, subject: data })
})

/** Update a subject (moderator only) */
subjects.patch('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const subjectId = c.req.param('id')
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

  const { name, year, exam_session, description } = await c.req.json()

  const { data, error } = await supabase
    .from('subjects')
    .update({
      name,
      year,
      exam_session,
      description,
    })
    .eq('id', subjectId)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, subject: data })
})

/** Delete a subject (moderator only) */
subjects.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const subjectId = c.req.param('id')
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

  const { error } = await supabase.from('subjects').delete().eq('id', subjectId)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, message: 'Subject deleted successfully' })
})

/** Assign a professor to a subject (moderator only) */
subjects.post('/:id/professors/:professorId', authMiddleware, async (c) => {
  const user = c.get('user')
  const subjectId = c.req.param('id')
  const professorId = c.req.param('professorId')
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

  const { error } = await supabase.from('subject_professors').insert({
    subject_id: subjectId,
    professor_id: professorId,
  })

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, message: 'Professor assigned to subject' })
})

/** Remove a professor from a subject (moderator only) */
subjects.delete('/:id/professors/:professorId', authMiddleware, async (c) => {
  const user = c.get('user')
  const subjectId = c.req.param('id')
  const professorId = c.req.param('professorId')
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
    .from('subject_professors')
    .delete()
    .eq('subject_id', subjectId)
    .eq('professor_id', professorId)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, message: 'Professor removed from subject' })
})

export default subjects
