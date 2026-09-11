import { Hono } from 'hono'
import { requiredParam } from '../lib/request'
import { createSupabaseClient } from '../lib/supabase'
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

async function getSelectedFacultyScope(
  supabase: ReturnType<typeof createSupabaseClient>
) {
  const { data: sessionData } = await supabase.auth.getUser()

  if (!sessionData.user) {
    return null
  }

  const { data } = await supabase
    .from('profile_faculties')
    .select('faculty_id')
    .eq('profile_id', sessionData.user.id)

  return data?.map(({ faculty_id }) => faculty_id) ?? []
}

/** Get all subjects */
subjects.get('/', async (c) => {
  const supabase = createSupabaseClient(c)
  const selectedFacultyIds = await getSelectedFacultyScope(supabase)

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

  if (!selectedFacultyIds || selectedFacultyIds.length === 0) {
    return c.json(data)
  }

  return c.json(
    data.filter(
      (subject) =>
        !subject.study?.faculty?.id ||
        selectedFacultyIds.includes(subject.study.faculty.id)
    )
  )
})

/** Get a single subject by ID */
subjects.get('/:id', async (c) => {
  const subjectId = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)

  const selectedFacultyIds = await getSelectedFacultyScope(supabase)

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

  if (
    selectedFacultyIds &&
    selectedFacultyIds.length > 0 &&
    (!data.study?.faculty?.id ||
      !selectedFacultyIds.includes(data.study.faculty.id))
  ) {
    return c.json(
      { error: 'Subject not available in your selected faculties' },
      404
    )
  }

  return c.json(data)
})

export default subjects
