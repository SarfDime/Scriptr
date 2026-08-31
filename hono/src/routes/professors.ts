import { Hono } from 'hono'
import { requiredParam } from '../lib/request'
import { createSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const professors = new Hono<HonoEnv>()

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

/** Get all professors */
professors.get('/', async (c) => {
  const supabase = createSupabaseClient(c)
  const selectedFacultyIds = await getSelectedFacultyScope(supabase)

  let query = supabase
    .from('professors')
    .select(`
      *,
      subjects:subject_professors(
        subject:subjects(*, faculty:faculties(id, name, university:universities(id, name)))
      ),
      faculties:professor_faculties(
        faculty:faculties(id, name, university:universities(id, name))
      )
    `)
    .order('name', { ascending: true })

  if (selectedFacultyIds && selectedFacultyIds.length > 0) {
    const { data: scopedProfessors } = await supabase
      .from('professor_faculties')
      .select('professor_id')
      .in('faculty_id', selectedFacultyIds)

    const professorIds = Array.from(
      new Set(scopedProfessors?.map(({ professor_id }) => professor_id) ?? [])
    )

    if (professorIds.length === 0) {
      return c.json([])
    }

    query = query.in('id', professorIds)
  }

  const { data, error } = await query

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

/** Get a single professor by ID */
professors.get('/:id', async (c) => {
  const professorId = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)

  const selectedFacultyIds = await getSelectedFacultyScope(supabase)

  const { data, error } = await supabase
    .from('professors')
    .select(`
      *,
      subjects:subject_professors(
        subject:subjects(*, faculty:faculties(id, name, university:universities(id, name)))
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

  if (
    selectedFacultyIds &&
    selectedFacultyIds.length > 0 &&
    !data.faculties?.some(
      ({ faculty }: { faculty?: { id?: string } }) =>
        faculty?.id && selectedFacultyIds.includes(faculty.id)
    )
  ) {
    return c.json(
      { error: 'Professor not available in your selected faculties' },
      404
    )
  }

  return c.json(data)
})

export default professors
