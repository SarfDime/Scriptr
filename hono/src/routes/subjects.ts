import { Hono } from 'hono'
import { requiredParam } from '../lib/request'
import { createSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const subjects = new Hono<HonoEnv>()

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

  let query = supabase
    .from('subjects')
    .select(`
      *,
      faculty:faculties(id, name, university:universities(id, name)),
      professors:subject_professors(
        professor:professors(*)
      ),
      scripts:scripts(count)
    `)
    .order('year', { ascending: true })
    .order('name', { ascending: true })

  if (selectedFacultyIds && selectedFacultyIds.length > 0) {
    query = query.in('faculty_id', selectedFacultyIds)
  }

  const { data, error } = await query

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

/** Get subjects by year */
subjects.get('/year/:year', async (c) => {
  const year = requiredParam(c, 'year')
  const supabase = createSupabaseClient(c)
  const selectedFacultyIds = await getSelectedFacultyScope(supabase)

  let query = supabase
    .from('subjects')
    .select(`
      *,
      faculty:faculties(id, name, university:universities(id, name)),
      professors:subject_professors(
        professor:professors(*)
      )
    `)
    .eq('year', Number(year))
    .order('name', { ascending: true })

  if (selectedFacultyIds && selectedFacultyIds.length > 0) {
    query = query.in('faculty_id', selectedFacultyIds)
  }

  const { data, error } = await query

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
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
      faculty:faculties(id, name, university:universities(id, name)),
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
    data.faculty_id &&
    !selectedFacultyIds.includes(data.faculty_id)
  ) {
    return c.json(
      { error: 'Subject not available in your selected faculties' },
      404
    )
  }

  return c.json(data)
})

export default subjects
