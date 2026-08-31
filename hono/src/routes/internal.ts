import { Hono } from 'hono'
import { requiredParam } from '../lib/request'
import { createInternalSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const internal = new Hono<HonoEnv>()

internal.use('*', async (c, next) => {
  const secret = c.req.header('x-internal-secret')
  const expected = c.env.INTERNAL_API_SECRET

  if (!expected || !secret || secret !== expected) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  return next()
})

internal.patch('/profiles/:id/role', async (c) => {
  const targetUserId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)
  const { role } = await c.req.json()

  if (!['student', 'moderator'].includes(role)) {
    return c.json(
      { error: 'Role must be either "student" or "moderator"' },
      400
    )
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', targetUserId)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, profile: data })
})

internal.get('/universities', async (c) => {
  const supabase = createInternalSupabaseClient(c)
  const { data, error } = await supabase.from('universities').select('*')

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

internal.post('/universities', async (c) => {
  const supabase = createInternalSupabaseClient(c)
  const { name } = await c.req.json()

  if (!name) {
    return c.json({ error: 'Name is required' }, 400)
  }

  const { data, error } = await supabase
    .from('universities')
    .insert({ name })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, university: data })
})

internal.patch('/universities/:id', async (c) => {
  const universityId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)
  const { name } = await c.req.json()

  const { data, error } = await supabase
    .from('universities')
    .update({ name })
    .eq('id', universityId)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, university: data })
})

internal.delete('/universities/:id', async (c) => {
  const universityId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)

  const { error } = await supabase
    .from('universities')
    .delete()
    .eq('id', universityId)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, message: 'University deleted successfully' })
})

internal.get('/faculties', async (c) => {
  const supabase = createInternalSupabaseClient(c)
  const { data, error } = await supabase.from('faculties').select('*')

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

internal.post('/faculties', async (c) => {
  const supabase = createInternalSupabaseClient(c)
  const { name, university_id } = await c.req.json()

  if (!name || !university_id) {
    return c.json({ error: 'Name and university_id are required' }, 400)
  }

  const { data, error } = await supabase
    .from('faculties')
    .insert({ name, university_id })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, faculty: data })
})

internal.patch('/faculties/:id', async (c) => {
  const facultyId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)
  const { name, university_id } = await c.req.json()

  const { data, error } = await supabase
    .from('faculties')
    .update({ name, university_id })
    .eq('id', facultyId)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, faculty: data })
})

internal.delete('/faculties/:id', async (c) => {
  const facultyId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)

  const { error } = await supabase
    .from('faculties')
    .delete()
    .eq('id', facultyId)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, message: 'Faculty deleted successfully' })
})

internal.get('/professors', async (c) => {
  const supabase = createInternalSupabaseClient(c)
  const { data, error } = await supabase.from('professors').select('*')

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

internal.post('/professors', async (c) => {
  const supabase = createInternalSupabaseClient(c)
  const { name, picture_url, bio, faculty_ids } = await c.req.json()

  if (!name) {
    return c.json({ error: 'Name is required' }, 400)
  }

  const { data, error } = await supabase
    .from('professors')
    .insert({ name, picture_url, bio })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)

  if (Array.isArray(faculty_ids) && faculty_ids.length > 0) {
    await supabase.from('professor_faculties').insert(
      faculty_ids.map((facultyId: string) => ({
        professor_id: data.id,
        faculty_id: facultyId,
      }))
    )
  }

  return c.json({ success: true, professor: data })
})

internal.patch('/professors/:id', async (c) => {
  const professorId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)
  const { name, picture_url, bio } = await c.req.json()

  const { data, error } = await supabase
    .from('professors')
    .update({ name, picture_url, bio })
    .eq('id', professorId)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, professor: data })
})

internal.delete('/professors/:id', async (c) => {
  const professorId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)

  const { error } = await supabase
    .from('professors')
    .delete()
    .eq('id', professorId)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, message: 'Professor deleted successfully' })
})

internal.post('/professors/:id/faculties/:facultyId', async (c) => {
  const professorId = requiredParam(c, 'id')
  const facultyId = requiredParam(c, 'facultyId')
  const supabase = createInternalSupabaseClient(c)

  const { error } = await supabase.from('professor_faculties').upsert(
    {
      professor_id: professorId,
      faculty_id: facultyId,
    },
    { onConflict: 'professor_id,faculty_id' }
  )

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, message: 'Professor assigned to faculty' })
})

internal.delete('/professors/:id/faculties/:facultyId', async (c) => {
  const professorId = requiredParam(c, 'id')
  const facultyId = requiredParam(c, 'facultyId')
  const supabase = createInternalSupabaseClient(c)

  const { error } = await supabase
    .from('professor_faculties')
    .delete()
    .eq('professor_id', professorId)
    .eq('faculty_id', facultyId)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, message: 'Professor removed from faculty' })
})

internal.get('/subjects', async (c) => {
  const supabase = createInternalSupabaseClient(c)
  const { data, error } = await supabase.from('subjects').select('*')

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

internal.post('/subjects', async (c) => {
  const supabase = createInternalSupabaseClient(c)
  const {
    name,
    year,
    exam_session,
    description,
    professor_ids,
    faculty_id,
    facultyId,
  } = await c.req.json()

  const resolvedFacultyId = faculty_id ?? facultyId

  if (!name || !year || !exam_session || !resolvedFacultyId) {
    return c.json(
      { error: 'Name, year, exam_session, and faculty_id are required' },
      400
    )
  }

  const { data, error } = await supabase
    .from('subjects')
    .insert({
      name,
      year,
      exam_session,
      description,
      faculty_id: resolvedFacultyId,
    })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)

  if (
    professor_ids &&
    Array.isArray(professor_ids) &&
    professor_ids.length > 0
  ) {
    await supabase.from('subject_professors').insert(
      professor_ids.map((profId: string) => ({
        subject_id: data.id,
        professor_id: profId,
      }))
    )
  }

  return c.json({ success: true, subject: data })
})

internal.patch('/subjects/:id', async (c) => {
  const subjectId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)
  const { name, year, exam_session, description, faculty_id, facultyId } =
    await c.req.json()

  const resolvedFacultyId = faculty_id ?? facultyId

  const { data, error } = await supabase
    .from('subjects')
    .update({
      ...(name !== undefined ? { name } : {}),
      ...(year !== undefined ? { year } : {}),
      ...(exam_session !== undefined ? { exam_session } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(resolvedFacultyId !== undefined
        ? { faculty_id: resolvedFacultyId }
        : {}),
    })
    .eq('id', subjectId)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, subject: data })
})

internal.delete('/subjects/:id', async (c) => {
  const subjectId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)

  const { error } = await supabase.from('subjects').delete().eq('id', subjectId)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, message: 'Subject deleted successfully' })
})

internal.post('/subjects/:id/professors/:professorId', async (c) => {
  const subjectId = requiredParam(c, 'id')
  const professorId = requiredParam(c, 'professorId')
  const supabase = createInternalSupabaseClient(c)

  const { error } = await supabase.from('subject_professors').insert({
    subject_id: subjectId,
    professor_id: professorId,
  })

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, message: 'Professor assigned to subject' })
})

internal.delete('/subjects/:id/professors/:professorId', async (c) => {
  const subjectId = requiredParam(c, 'id')
  const professorId = requiredParam(c, 'professorId')
  const supabase = createInternalSupabaseClient(c)

  const { error } = await supabase
    .from('subject_professors')
    .delete()
    .eq('subject_id', subjectId)
    .eq('professor_id', professorId)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, message: 'Professor removed from subject' })
})

export default internal
