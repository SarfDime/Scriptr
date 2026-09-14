import { Hono } from 'hono'
import { requiredParam } from '../lib/request'
import { createInternalSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const studies = new Hono<HonoEnv>()

// Academic catalog data is admin-managed; not exposed to end users directly.
// TODO: Verify all of these are operational since it was just a copy from faculties route
studies.use('*', async (c, next) => {
  const secret = c.req.header('x-internal-secret')
  const expected = c.env.INTERNAL_API_SECRET

  if (!expected || !secret || secret !== expected) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  return next()
})

/** Get all studies with university metadata and subject/professor counts */
studies.get('/', async (c) => {
  const supabase = createInternalSupabaseClient(c)

  const { data, error } = await supabase
    .from('studies')
    .select(
      `*, faculty:faculties(id, name), subjects:subjects(count), professor_count:professor_studies(count)`
    )
    .order('name', { ascending: true })

  if (error) return c.json({ error: error.message }, 500)

  const withCounts = data?.map(({ subjects, ...study }) => ({
    ...study,
    subject_count: subjects[0]?.count ?? 0,
  }))

  return c.json(withCounts)
})

/** Get a single study by ID, with its subjects and assigned professors */
studies.get('/:id', async (c) => {
  const studyId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)

  const { data, error } = await supabase
    .from('studies')
    .select(
      `*, faculty:faculties(id, name), subjects:subjects(*), professors:professor_studies(professor:professors(*))`
    )
    .eq('id', studyId)
    .single()

  if (error) return c.json({ error: error.message }, 404)
  return c.json(data)
})

export default studies
