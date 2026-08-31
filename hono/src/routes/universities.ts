import { Hono } from 'hono'
import { requiredParam } from '../lib/request'
import { createSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const universities = new Hono<HonoEnv>()

universities.get('/', async (c) => {
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('universities')
    .select('*, faculties:faculties(*)')
    .order('name', { ascending: true })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

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
