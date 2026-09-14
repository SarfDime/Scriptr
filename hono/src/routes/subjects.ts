import { Hono } from 'hono'
import { requiredParam } from '../lib/request'
import { createInternalSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const subjects = new Hono<HonoEnv>()

// Academic catalog data is admin-managed; not exposed to end users directly.
subjects.use('*', async (c, next) => {
  const secret = c.req.header('x-internal-secret')
  const expected = c.env.INTERNAL_API_SECRET

  if (!expected || !secret || secret !== expected) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  return next()
})

/** Get all subjects with study, faculty, professor, and script-count metadata */
subjects.get('/', async (c) => {
  const supabase = createInternalSupabaseClient(c)

  const { data, error } = await supabase
    .from('subjects')
    .select(`
        *,
        study:studies(id, name, faculty:faculties(id, name, university:universities(id, name))),
        professors:subject_professors(
          professor:professors(*)
        ),
        scripts:scripts(count)
      `)
    .order('name', { ascending: true })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

/** Get a single subject with study, faculty, professor, and script metadata */
subjects.get('/:id', async (c) => {
  const subjectId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)

  const { data, error } = await supabase
    .from('subjects')
    .select(`
        *,
        study:studies(id, name, faculty:faculties(id, name, university:universities(id, name))),
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

export default subjects
