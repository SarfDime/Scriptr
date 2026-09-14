import { Hono } from 'hono'
import { requiredParam } from '../lib/request'
import { createInternalSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const faculties = new Hono<HonoEnv>()

// Academic catalog data is admin-managed; not exposed to end users directly.
faculties.use('*', async (c, next) => {
  const secret = c.req.header('x-internal-secret')
  const expected = c.env.INTERNAL_API_SECRET

  if (!expected || !secret || secret !== expected) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  return next()
})

/** Get all faculties with university metadata and subject/professor counts */
faculties.get('/', async (c) => {
  const supabase = createInternalSupabaseClient(c)

  const { data, error } = await supabase
    .from('faculties')
    .select(
      `*, university:universities(id, name), studies:studies(subjects(count)), professor_count:professor_faculties(count)`
    )
    .order('name', { ascending: true })

  if (error) return c.json({ error: error.message }, 500)

  const withCounts = data?.map(({ studies, ...faculty }) => ({
    ...faculty,
    subject_count: studies.reduce(
      (total, study) => total + (study.subjects[0]?.count ?? 0),
      0
    ),
  }))

  return c.json(withCounts)
})

/** Get a single faculty by ID, with its studies (and their subjects) and assigned professors */
faculties.get('/:id', async (c) => {
  const facultyId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)

  const { data, error } = await supabase
    .from('faculties')
    .select(
      `*, university:universities(id, name), studies:studies(*, subjects:subjects(*)), professors:professor_faculties(professor:professors(*))`
    )
    .eq('id', facultyId)
    .single()

  if (error) return c.json({ error: error.message }, 404)
  return c.json(data)
})

export default faculties
