import { Hono } from 'hono'
import { databaseErrorResponse, requiredParam } from '../lib/request'
import { createInternalSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const professors = new Hono<HonoEnv>()

// Academic catalog data is admin-managed; not exposed to end users directly.
professors.use('*', async (c, next) => {
  const secret = c.req.header('x-internal-secret')
  const expected = c.env.INTERNAL_API_SECRET

  if (!expected || !secret || secret !== expected) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  return next()
})

/** Get all professors with their subjects, studies, and faculty metadata */
professors.get('/', async (c) => {
  const supabase = createInternalSupabaseClient(c)

  const { data, error } = await supabase
    .from('professors')
    .select(`
        *,
        subjects:subject_professors(
          subject:subjects(*, study:studies(id, name, faculty:faculties(id, name, university:universities(id, name))))
        ),
        studies:professor_studies(
          study:studies(id, name, faculty:faculties(id, name, university:universities(id, name)))
        ),
        faculties:professor_faculties(
          faculty:faculties(id, name, university:universities(id, name))
        )
      `)
    .order('name', { ascending: true })

  if (error) return databaseErrorResponse(c, error)
  return c.json(data)
})

/** Get a single professor by ID with subjects, studies, faculties, and comments */
professors.get('/:id', async (c) => {
  const professorId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)

  const { data, error } = await supabase
    .from('professors')
    .select(`
        *,
        subjects:subject_professors(
          subject:subjects(*, study:studies(id, name, faculty:faculties(id, name, university:universities(id, name))))
        ),
        studies:professor_studies(
          study:studies(id, name, faculty:faculties(id, name, university:universities(id, name)))
        ),
        faculties:professor_faculties(
          faculty:faculties(id, name, university:universities(id, name))
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

export default professors
