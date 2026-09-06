import { Hono } from 'hono'
import { requiredParam } from '../lib/request'
import { createSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const universities = new Hono<HonoEnv>()

// Academic catalog data is admin-managed; not exposed to end users directly.
universities.use('*', async (c, next) => {
  const secret = c.req.header('x-internal-secret')
  const expected = c.env.INTERNAL_API_SECRET

  if (!expected || !secret || secret !== expected) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  return next()
})

/** Get all universities with their faculties */
universities.get('/', async (c) => {
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('universities')
    .select('*, faculties:faculties(*)')
    .order('name', { ascending: true })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

/** Get a single university by ID, with its faculties */
universities.get('/:id', async (c) => {
  const universityId = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('universities')
    .select('*, faculties:faculties(*)')
    .eq('id', universityId)
    .single()

  if (error) return c.json({ error: error.message }, 404)
  return c.json(data)
})

export default universities
