import { Hono } from 'hono'
import { profileMutationTags } from '../../../shared/config/cache-tags'
import type { Database } from '../../../shared/types/database.types'
import type { ScriptSitemapEntry } from '../../../shared/types/scripts.types'
import { isUserRole } from '../../../shared/utils/api.utils'
import { revalidateCacheTags } from '../lib/cache-revalidate'
import { databaseErrorResponse, requiredParam } from '../lib/request'
import { createInternalSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

type TableName =
  | keyof Database['public']['Tables']
  | 'profile_studies'
  | 'professor_studies'

type InternalSupabase = ReturnType<typeof createInternalSupabaseClient>

const R2_BUCKET_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/

function isValidR2BucketId(value: unknown): value is string {
  return typeof value === 'string' && R2_BUCKET_ID_PATTERN.test(value)
}

function validateR2BucketId(value: unknown) {
  if (value !== undefined && value !== null && !isValidR2BucketId(value)) {
    return 'r2_bucket_id must be a valid R2/S3 bucket name'
  }
  return null
}

function normalizeR2BucketId(value: unknown): string | null | undefined {
  if (value === undefined || value === null) return value
  return isValidR2BucketId(value) ? value : undefined
}

function mapPostgresError(
  error: { code?: string; message: string },
  dependentMessage = 'This record still has dependents.'
) {
  switch (error.code) {
    case '23505':
      return { status: 409 as const, body: { error: 'Already exists' } }
    case '23503':
      return { status: 409 as const, body: { error: dependentMessage } }
    case '42501':
      return { status: 403 as const, body: { error: 'Forbidden' } }
    case 'P0001':
      return { status: 400 as const, body: { error: error.message } }
    default:
      return {
        status: 500 as const,
        body: { error: 'Unable to complete the request' },
      }
  }
}

async function syncProfessorFacultyAssignments(
  supabase: InternalSupabase,
  professorId: string,
  desiredFacultyIds: Array<string>
) {
  const { data: currentRows, error: selectError } = await supabase
    .from('professor_faculties')
    .select('faculty_id')
    .eq('professor_id', professorId)

  if (selectError) throw new Error(selectError.message)

  const currentSet = new Set(
    (currentRows ?? []).map((row) => String(row.faculty_id))
  )
  const desiredSet = new Set(desiredFacultyIds)

  const toAdd = [...desiredSet].filter((id) => !currentSet.has(id))
  const toRemove = [...currentSet].filter((id) => !desiredSet.has(id))

  if (toAdd.length > 0) {
    const { error: insertError } = await supabase
      .from('professor_faculties')
      .upsert(
        toAdd.map((facultyId) => ({
          professor_id: professorId,
          faculty_id: facultyId,
        })),
        { onConflict: 'professor_id,faculty_id' }
      )

    if (insertError) throw new Error(insertError.message)
  }

  if (toRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from('professor_faculties')
      .delete()
      .eq('professor_id', professorId)
      .in('faculty_id', toRemove)

    if (deleteError) throw new Error(deleteError.message)
  }
}

async function syncProfessorStudyAssignments(
  supabase: InternalSupabase,
  professorId: string,
  desiredStudyIds: Array<string>
) {
  const { data: currentRows, error: selectError } = await supabase
    .from('professor_studies')
    .select('study_id')
    .eq('professor_id', professorId)

  if (selectError) throw new Error(selectError.message)

  const currentSet = new Set(
    (currentRows ?? []).map((row) => String(row.study_id))
  )
  const desiredSet = new Set(desiredStudyIds)

  const toAdd = [...desiredSet].filter((id) => !currentSet.has(id))
  const toRemove = [...currentSet].filter((id) => !desiredSet.has(id))

  if (toAdd.length > 0) {
    const { error: insertError } = await supabase
      .from('professor_studies')
      .upsert(
        toAdd.map((studyId) => ({
          professor_id: professorId,
          study_id: studyId,
        })),
        { onConflict: 'professor_id,study_id' }
      )

    if (insertError) throw new Error(insertError.message)
  }

  if (toRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from('professor_studies')
      .delete()
      .eq('professor_id', professorId)
      .in('study_id', toRemove)

    if (deleteError) throw new Error(deleteError.message)
  }
}

async function syncSubjectProfessorAssignments(
  supabase: InternalSupabase,
  subjectId: string,
  desiredProfessorIds: Array<string>
) {
  const { data: currentRows, error: selectError } = await supabase
    .from('subject_professors')
    .select('professor_id')
    .eq('subject_id', subjectId)

  if (selectError) throw new Error(selectError.message)

  const currentSet = new Set(
    (currentRows ?? []).map((row) => String(row.professor_id))
  )
  const desiredSet = new Set(desiredProfessorIds)

  const toAdd = [...desiredSet].filter((id) => !currentSet.has(id))
  const toRemove = [...currentSet].filter((id) => !desiredSet.has(id))

  if (toAdd.length > 0) {
    const { error: insertError } = await supabase
      .from('subject_professors')
      .upsert(
        toAdd.map((professorId) => ({
          subject_id: subjectId,
          professor_id: professorId,
        })),
        { onConflict: 'subject_id,professor_id' }
      )

    if (insertError) throw new Error(insertError.message)
  }

  if (toRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from('subject_professors')
      .delete()
      .eq('subject_id', subjectId)
      .in('professor_id', toRemove)

    if (deleteError) throw new Error(deleteError.message)
  }
}

/** Find a row already linked to this Sanity document, if any (keeps "create in DB" idempotent) */
async function findBySanityId(
  supabase: InternalSupabase,
  table: 'universities' | 'faculties' | 'professors' | 'subjects' | 'studies',
  sanityId: unknown
) {
  if (typeof sanityId !== 'string' || !sanityId) return null
  const { data } = await supabase
    .from(table)
    .select('*')
    .eq('sanity_id', sanityId)
    .maybeSingle()
  return data
}

/** Report which dependent tables still reference this row, so deletion can be blocked cleanly */
async function findBlockingDependents(
  supabase: InternalSupabase,
  id: string,
  checks: Array<{ table: TableName; column: string; label: string }>
) {
  const results = await Promise.all(
    checks.map(({ table, column }) =>
      supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq(column, id)
    )
  )

  return checks
    .filter((_, index) => (results[index]?.count ?? 0) > 0)
    .map(({ label }) => label)
}

/** Create a professor, optionally assigning it to faculties, or return the
 * existing one already linked to this Sanity document */

/** Create a subject, optionally assigning professors, or return the existing
 * one already linked to this Sanity document */

const internal = new Hono<HonoEnv>()

/** Internal API authentication middleware */
internal.use('*', async (c, next) => {
  const secret = c.req.header('x-internal-secret')
  const expected = c.env.INTERNAL_API_SECRET

  if (!expected || !secret || secret !== expected) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  return next()
})

/** Every script's address, for the sitemap.
 *
 * Internal rather than public because `GET /scripts` is admin-only and
 * paginated: a crawler-facing list has to be complete, but it also has no
 * business carrying files, comment counts or author profiles, so it selects
 * two columns and nothing else. */
internal.get('/scripts/sitemap', async (c) => {
  const supabase = createInternalSupabaseClient(c)

  const { data, error } = await supabase
    .from('scripts')
    .select('slug, updated_at')
    .order('created_at', { ascending: false })

  if (error) return databaseErrorResponse(c, error)

  return c.json<Array<ScriptSitemapEntry>>(data)
})

/** Update a user's role */
internal.patch('/profiles/:id/role', async (c) => {
  const targetUserId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)
  const { role } = await c.req.json()

  if (!isUserRole(role)) {
    return c.json(
      { error: 'Role must be "student", "moderator", or "admin"' },
      400
    )
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', targetUserId)
    .select()
    .single()

  if (error) return databaseErrorResponse(c, error)
  await revalidateCacheTags(c.env, profileMutationTags(targetUserId))
  return c.json({ success: true, profile: data })
})

/** List all universities */
internal.get('/universities', async (c) => {
  const supabase = createInternalSupabaseClient(c)
  const { data, error } = await supabase.from('universities').select('*')

  if (error) return databaseErrorResponse(c, error)
  return c.json(data)
})

/** Look up the university linked to a Sanity document, if one exists */
internal.get('/universities/by-sanity/:sanityId', async (c) => {
  const sanityId = requiredParam(c, 'sanityId')
  const supabase = createInternalSupabaseClient(c)
  const data = await findBySanityId(supabase, 'universities', sanityId)

  if (!data)
    return c.json({ error: 'Not linked to a database record yet' }, 404)
  return c.json(data)
})

/** Create a university, or return the existing one already linked to this Sanity document */
internal.post('/universities', async (c) => {
  const supabase = createInternalSupabaseClient(c)
  const { name, sanity_id, r2_bucket_id } = await c.req.json()

  if (typeof name !== 'string' || name.trim().length === 0) {
    return c.json({ error: 'Name is required' }, 400)
  }
  const bucketError = validateR2BucketId(r2_bucket_id)
  if (bucketError) return c.json({ error: bucketError }, 400)

  const existing = await findBySanityId(supabase, 'universities', sanity_id)
  if (existing) {
    return c.json({ success: true, university: existing, existing: true })
  }

  const { data, error } = await supabase
    .from('universities')
    .insert({
      name,
      sanity_id: typeof sanity_id === 'string' ? sanity_id : null,
      r2_bucket_id: r2_bucket_id ?? null,
    })
    .select()
    .single()

  if (error) {
    const mapped = mapPostgresError(error)
    if (error.code === '23505') {
      mapped.body.error =
        'This Sanity document is already linked to a university'
    }
    return c.json(mapped.body, mapped.status)
  }

  return c.json({ success: true, university: data })
})

/** Update a university */
internal.patch('/universities/:id', async (c) => {
  const universityId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)
  const { name, r2_bucket_id } = await c.req.json()

  if (
    name !== undefined &&
    (typeof name !== 'string' || name.trim().length === 0)
  ) {
    return c.json({ error: 'name must be a non-empty string' }, 400)
  }
  const bucketError = validateR2BucketId(r2_bucket_id)
  if (bucketError) return c.json({ error: bucketError }, 400)

  const update: { name?: string; r2_bucket_id?: string | null } = {}
  if (name !== undefined) update.name = name
  if (r2_bucket_id !== undefined) update.r2_bucket_id = r2_bucket_id
  if (Object.keys(update).length === 0) {
    return c.json({ error: 'No updatable fields provided' }, 400)
  }

  const { data, error } = await supabase
    .from('universities')
    .update(update)
    .eq('id', universityId)
    .select()
    .single()

  if (error) {
    const mapped = mapPostgresError(error)
    return c.json(mapped.body, mapped.status)
  }
  return c.json({ success: true, university: data })
})

/** Sync a university with the latest Sanity values. */
internal.post('/universities/:id/sync', async (c) => {
  const universityId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)
  const { name, r2_bucket_id } = await c.req.json()

  if (typeof name !== 'string' || name.trim().length === 0) {
    return c.json({ error: 'Name is required' }, 400)
  }
  const bucketError = validateR2BucketId(r2_bucket_id)
  if (bucketError) return c.json({ error: bucketError }, 400)

  const { data: existingUniversity, error: existingError } = await supabase
    .from('universities')
    .select('id')
    .eq('id', universityId)
    .maybeSingle()

  if (existingError) {
    const mapped = mapPostgresError(existingError)
    return c.json(mapped.body, mapped.status)
  }
  if (!existingUniversity) {
    return c.json({ error: 'University database record not found' }, 404)
  }

  const { data, error } = await supabase
    .from('universities')
    .update({
      name,
      ...(r2_bucket_id !== undefined
        ? { r2_bucket_id: normalizeR2BucketId(r2_bucket_id) }
        : {}),
    })
    .eq('id', universityId)
    .select()
    .single()

  if (error) {
    const mapped = mapPostgresError(error)
    return c.json(mapped.body, mapped.status)
  }
  return c.json({ success: true, university: data })
})

/** Delete a university (blocked if any faculty still references it) */
internal.delete('/universities/:id', async (c) => {
  const universityId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)

  const blockers = await findBlockingDependents(supabase, universityId, [
    { table: 'faculties', column: 'university_id', label: 'faculties' },
  ])

  if (blockers.length > 0) {
    return c.json(
      { error: `Cannot delete: still referenced by ${blockers.join(', ')}` },
      409
    )
  }

  const { error } = await supabase
    .from('universities')
    .delete()
    .eq('id', universityId)

  if (error) {
    const mapped = mapPostgresError(error)
    return c.json(mapped.body, mapped.status)
  }
  return c.json({ success: true, message: 'University deleted successfully' })
})

/** List all faculties */
internal.get('/faculties', async (c) => {
  const supabase = createInternalSupabaseClient(c)
  const { data, error } = await supabase.from('faculties').select('*')

  if (error) return databaseErrorResponse(c, error)
  return c.json(data)
})

/** Look up the faculty linked to a Sanity document, if one exists */
internal.get('/faculties/by-sanity/:sanityId', async (c) => {
  const sanityId = requiredParam(c, 'sanityId')
  const supabase = createInternalSupabaseClient(c)
  const data = await findBySanityId(supabase, 'faculties', sanityId)

  if (!data)
    return c.json({ error: 'Not linked to a database record yet' }, 404)
  return c.json(data)
})

/** Create a faculty, or return the existing one already linked to this Sanity document */
internal.post('/faculties', async (c) => {
  const supabase = createInternalSupabaseClient(c)
  const { name, university_id, sanity_id } = await c.req.json()

  if (!name || !university_id) {
    return c.json({ error: 'Name and university_id are required' }, 400)
  }

  const existing = await findBySanityId(supabase, 'faculties', sanity_id)
  if (existing) {
    return c.json({ success: true, faculty: existing, existing: true })
  }

  const { data, error } = await supabase
    .from('faculties')
    .insert({ name, university_id, sanity_id: sanity_id ?? null })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return c.json(
        { error: 'This Sanity document is already linked to a faculty' },
        409
      )
    }
    return databaseErrorResponse(c, error)
  }

  return c.json({ success: true, faculty: data })
})

/** Update a faculty */
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

  if (error) return databaseErrorResponse(c, error)
  return c.json({ success: true, faculty: data })
})

/** Sync a faculty with the latest Sanity values. */
internal.post('/faculties/:id/sync', async (c) => {
  const facultyId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)
  const { name, university_id } = await c.req.json()

  if (!name || !university_id) {
    return c.json({ error: 'Name and university_id are required' }, 400)
  }

  const { data: existingFaculty, error: existingError } = await supabase
    .from('faculties')
    .select('id')
    .eq('id', facultyId)
    .maybeSingle()

  if (existingError) return databaseErrorResponse(c, existingError)
  if (!existingFaculty) {
    return c.json({ error: 'Faculty database record not found' }, 404)
  }

  const { data, error } = await supabase
    .from('faculties')
    .update({ name, university_id })
    .eq('id', facultyId)
    .select()
    .single()

  if (error) return databaseErrorResponse(c, error)
  return c.json({ success: true, faculty: data })
})

/** Delete a faculty (blocked if anything still references it) */
internal.delete('/faculties/:id', async (c) => {
  const facultyId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)

  const blockers = await findBlockingDependents(supabase, facultyId, [
    { table: 'studies', column: 'faculty_id', label: 'studies' },
    {
      table: 'professor_faculties',
      column: 'faculty_id',
      label: 'professor assignments',
    },
    {
      table: 'profile_faculties',
      column: 'faculty_id',
      label: 'user faculty selections',
    },
  ])

  if (blockers.length > 0) {
    return c.json(
      { error: `Cannot delete: still referenced by ${blockers.join(', ')}` },
      409
    )
  }

  const { error } = await supabase
    .from('faculties')
    .delete()
    .eq('id', facultyId)

  if (error) return databaseErrorResponse(c, error)
  return c.json({ success: true, message: 'Faculty deleted successfully' })
})

/** List all studies. */
internal.get('/studies', async (c) => {
  const supabase = createInternalSupabaseClient(c)
  const { data, error } = await supabase
    .from('studies')
    .select('*, faculty:faculties(id, name, university:universities(id, name))')
    .order('name', { ascending: true })

  if (error) return databaseErrorResponse(c, error)
  return c.json(data)
})

/** Create a study, or return the existing Sanity-linked record. */
internal.post('/studies', async (c) => {
  const supabase = createInternalSupabaseClient(c)
  const { name, faculty_id, sanity_id } = await c.req.json()

  if (!name || !faculty_id) {
    return c.json({ error: 'Name and faculty_id are required' }, 400)
  }

  const existing = await findBySanityId(supabase, 'studies', sanity_id)
  if (existing) {
    return c.json({ success: true, study: existing, existing: true })
  }

  const { data, error } = await supabase
    .from('studies')
    .insert({ name, faculty_id, sanity_id: sanity_id ?? null })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return c.json({ error: 'This study already exists in this faculty' }, 409)
    }
    return databaseErrorResponse(c, error)
  }

  return c.json({ success: true, study: data })
})

/** Update a study. */
internal.patch('/studies/:id', async (c) => {
  const studyId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)
  const { name, faculty_id } = await c.req.json()

  const { data, error } = await supabase
    .from('studies')
    .update({ name, faculty_id })
    .eq('id', studyId)
    .select()
    .single()

  if (error) return databaseErrorResponse(c, error)
  return c.json({ success: true, study: data })
})

/** Sync a study with its Sanity document. */
internal.post('/studies/:id/sync', async (c) => {
  const studyId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)
  const { name, faculty_id } = await c.req.json()

  if (!name || !faculty_id) {
    return c.json({ error: 'Name and faculty_id are required' }, 400)
  }

  const { data, error } = await supabase
    .from('studies')
    .update({ name, faculty_id })
    .eq('id', studyId)
    .select()
    .single()

  if (error) return databaseErrorResponse(c, error)
  return c.json({ success: true, study: data })
})

/** Delete a study when no subject still references it. */
internal.delete('/studies/:id', async (c) => {
  const studyId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)
  const blockers = await findBlockingDependents(supabase, studyId, [
    { table: 'subjects', column: 'study_id', label: 'subjects' },
    {
      table: 'professor_studies',
      column: 'study_id',
      label: 'professor assignments',
    },
    {
      table: 'profile_studies',
      column: 'study_id',
      label: 'user study enrollments',
    },
  ])

  if (blockers.length > 0) {
    return c.json(
      { error: `Cannot delete: still referenced by ${blockers.join(', ')}` },
      409
    )
  }

  const { error } = await supabase.from('studies').delete().eq('id', studyId)

  if (error) return databaseErrorResponse(c, error)
  return c.json({
    success: true,
    message: 'Study deleted successfully',
  })
})

/** List all professors */
internal.get('/professors', async (c) => {
  const supabase = createInternalSupabaseClient(c)
  const { data, error } = await supabase.from('professors').select('*')

  if (error) return databaseErrorResponse(c, error)
  return c.json(data)
})

/** Look up the professor linked to a Sanity document, if one exists */
internal.get('/professors/by-sanity/:sanityId', async (c) => {
  const sanityId = requiredParam(c, 'sanityId')
  const supabase = createInternalSupabaseClient(c)
  const data = await findBySanityId(supabase, 'professors', sanityId)

  if (!data)
    return c.json({ error: 'Not linked to a database record yet' }, 404)
  return c.json(data)
})

internal.post('/professors', async (c) => {
  const supabase = createInternalSupabaseClient(c)
  const { name, faculty_ids, study_ids, sanity_id } = await c.req.json()

  if (!name) {
    return c.json({ error: 'Name is required' }, 400)
  }

  const existing = await findBySanityId(supabase, 'professors', sanity_id)
  if (existing) {
    return c.json({ success: true, professor: existing, existing: true })
  }

  const { data, error } = await supabase
    .from('professors')
    .insert({ name, sanity_id: sanity_id ?? null })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return c.json(
        { error: 'This Sanity document is already linked to a professor' },
        409
      )
    }
    return databaseErrorResponse(c, error)
  }

  if (Array.isArray(faculty_ids) && faculty_ids.length > 0) {
    await supabase.from('professor_faculties').insert(
      faculty_ids.map((facultyId: string) => ({
        professor_id: data.id,
        faculty_id: facultyId,
      }))
    )
  }

  if (Array.isArray(study_ids) && study_ids.length > 0) {
    await supabase.from('professor_studies').insert(
      study_ids.map((studyId: string) => ({
        professor_id: data.id,
        study_id: studyId,
      }))
    )
  }

  return c.json({ success: true, professor: data })
})

/** Update a professor */
internal.patch('/professors/:id', async (c) => {
  const professorId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)
  const { name } = await c.req.json()

  const { data, error } = await supabase
    .from('professors')
    .update({ name })
    .eq('id', professorId)
    .select()
    .single()

  if (error) return databaseErrorResponse(c, error)
  return c.json({ success: true, professor: data })
})

/** Assign a professor to a study */
internal.post('/professors/:id/studies/:studyId', async (c) => {
  const professorId = requiredParam(c, 'id')
  const studyId = requiredParam(c, 'studyId')
  const supabase = createInternalSupabaseClient(c)

  const { error } = await supabase
    .from('professor_studies')
    .upsert(
      { professor_id: professorId, study_id: studyId },
      { onConflict: 'professor_id,study_id' }
    )

  if (error) return databaseErrorResponse(c, error)
  return c.json({ success: true, message: 'Professor assigned to study' })
})

/** Remove a professor from a study */
internal.delete('/professors/:id/studies/:studyId', async (c) => {
  const professorId = requiredParam(c, 'id')
  const studyId = requiredParam(c, 'studyId')
  const supabase = createInternalSupabaseClient(c)

  const { error } = await supabase
    .from('professor_studies')
    .delete()
    .eq('professor_id', professorId)
    .eq('study_id', studyId)

  if (error) return databaseErrorResponse(c, error)
  return c.json({ success: true, message: 'Professor removed from study' })
})

/** Sync a professor with the latest Sanity values and join-table assignments. */
internal.post('/professors/:id/sync', async (c) => {
  const professorId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)
  const { name, faculty_ids, study_ids } = await c.req.json()

  if (!name) {
    return c.json({ error: 'Name is required' }, 400)
  }

  const { data: existingProfessor, error: existingError } = await supabase
    .from('professors')
    .select('id')
    .eq('id', professorId)
    .maybeSingle()

  if (existingError) return databaseErrorResponse(c, existingError)
  if (!existingProfessor) {
    return c.json({ error: 'Professor database record not found' }, 404)
  }

  const { data, error } = await supabase
    .from('professors')
    .update({ name })
    .eq('id', professorId)
    .select()
    .single()

  if (error) return databaseErrorResponse(c, error)

  try {
    await syncProfessorFacultyAssignments(
      supabase,
      professorId,
      Array.isArray(faculty_ids) ? faculty_ids : []
    )
    await syncProfessorStudyAssignments(
      supabase,
      professorId,
      Array.isArray(study_ids) ? study_ids : []
    )
  } catch (syncError) {
    return c.json(
      {
        error:
          syncError instanceof Error
            ? syncError.message
            : 'Failed to sync professor assignments',
      },
      500
    )
  }

  return c.json({ success: true, professor: data })
})

/** Delete a professor (blocked if anything still references it) */
internal.delete('/professors/:id', async (c) => {
  const professorId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)

  const blockers = await findBlockingDependents(supabase, professorId, [
    {
      table: 'subject_professors',
      column: 'professor_id',
      label: 'subject assignments',
    },
    {
      table: 'professor_faculties',
      column: 'professor_id',
      label: 'faculty assignments',
    },
    {
      table: 'professor_studies',
      column: 'professor_id',
      label: 'study assignments',
    },
    { table: 'scripts', column: 'professor_id', label: 'scripts' },
    { table: 'comments', column: 'professor_id', label: 'comments' },
  ])

  if (blockers.length > 0) {
    return c.json(
      { error: `Cannot delete: still referenced by ${blockers.join(', ')}` },
      409
    )
  }

  const { error } = await supabase
    .from('professors')
    .delete()
    .eq('id', professorId)

  if (error) return databaseErrorResponse(c, error)
  return c.json({ success: true, message: 'Professor deleted successfully' })
})

/** Assign a professor to a faculty */
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

  if (error) return databaseErrorResponse(c, error)
  return c.json({ success: true, message: 'Professor assigned to faculty' })
})

/** Remove a professor from a faculty */
internal.delete('/professors/:id/faculties/:facultyId', async (c) => {
  const professorId = requiredParam(c, 'id')
  const facultyId = requiredParam(c, 'facultyId')
  const supabase = createInternalSupabaseClient(c)

  const { error } = await supabase
    .from('professor_faculties')
    .delete()
    .eq('professor_id', professorId)
    .eq('faculty_id', facultyId)

  if (error) return databaseErrorResponse(c, error)
  return c.json({ success: true, message: 'Professor removed from faculty' })
})

/** List all subjects */
internal.get('/subjects', async (c) => {
  const supabase = createInternalSupabaseClient(c)
  const { data, error } = await supabase.from('subjects').select('*')

  if (error) return databaseErrorResponse(c, error)
  return c.json(data)
})

/** Look up the subject linked to a Sanity document, if one exists */
internal.get('/subjects/by-sanity/:sanityId', async (c) => {
  const sanityId = requiredParam(c, 'sanityId')
  const supabase = createInternalSupabaseClient(c)
  const data = await findBySanityId(supabase, 'subjects', sanityId)

  if (!data)
    return c.json({ error: 'Not linked to a database record yet' }, 404)
  return c.json(data)
})

internal.post('/subjects', async (c) => {
  const supabase = createInternalSupabaseClient(c)
  const { name, professor_ids, study_id, sanity_id } = await c.req.json()

  if (!name || !study_id) {
    return c.json({ error: 'Name and study_id are required' }, 400)
  }

  const existing = await findBySanityId(supabase, 'subjects', sanity_id)
  if (existing) {
    return c.json({ success: true, subject: existing, existing: true })
  }

  const { data, error } = await supabase
    .from('subjects')
    .insert({
      name,
      study_id,
      sanity_id: sanity_id ?? null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return c.json(
        { error: 'This Sanity document is already linked to a subject' },
        409
      )
    }
    return databaseErrorResponse(c, error)
  }

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

/** Update a subject */
internal.patch('/subjects/:id', async (c) => {
  const subjectId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)
  const { name, study_id } = await c.req.json()

  const { data, error } = await supabase
    .from('subjects')
    .update({
      ...(name !== undefined ? { name } : {}),
      ...(study_id !== undefined ? { study_id } : {}),
    })
    .eq('id', subjectId)
    .select()
    .single()

  if (error) return databaseErrorResponse(c, error)
  return c.json({ success: true, subject: data })
})

/** Sync a subject with the latest Sanity values and professor assignments. */
internal.post('/subjects/:id/sync', async (c) => {
  const subjectId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)
  const { name, study_id, professor_ids } = await c.req.json()

  if (!name || !study_id) {
    return c.json({ error: 'Name and study_id are required' }, 400)
  }

  const { data: existingSubject, error: existingError } = await supabase
    .from('subjects')
    .select('id')
    .eq('id', subjectId)
    .maybeSingle()

  if (existingError) return databaseErrorResponse(c, existingError)
  if (!existingSubject) {
    return c.json({ error: 'Subject database record not found' }, 404)
  }

  const { data, error } = await supabase
    .from('subjects')
    .update({
      name,
      study_id,
    })
    .eq('id', subjectId)
    .select()
    .single()

  if (error) return databaseErrorResponse(c, error)

  try {
    await syncSubjectProfessorAssignments(
      supabase,
      subjectId,
      Array.isArray(professor_ids) ? professor_ids : []
    )
  } catch (syncError) {
    return c.json(
      {
        error:
          syncError instanceof Error
            ? syncError.message
            : 'Failed to sync subject professor assignments',
      },
      500
    )
  }

  return c.json({ success: true, subject: data })
})

/** Delete a subject (blocked if anything still references it) */
internal.delete('/subjects/:id', async (c) => {
  const subjectId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)

  const blockers = await findBlockingDependents(supabase, subjectId, [
    {
      table: 'subject_professors',
      column: 'subject_id',
      label: 'professor assignments',
    },
    {
      table: 'profile_subjects',
      column: 'subject_id',
      label: 'user subject statuses',
    },
    { table: 'scripts', column: 'subject_id', label: 'scripts' },
  ])

  if (blockers.length > 0) {
    return c.json(
      { error: `Cannot delete: still referenced by ${blockers.join(', ')}` },
      409
    )
  }

  const { error } = await supabase.from('subjects').delete().eq('id', subjectId)

  if (error) return databaseErrorResponse(c, error)
  return c.json({ success: true, message: 'Subject deleted successfully' })
})

/** Assign a professor to a subject */
internal.post('/subjects/:id/professors/:professorId', async (c) => {
  const subjectId = requiredParam(c, 'id')
  const professorId = requiredParam(c, 'professorId')
  const supabase = createInternalSupabaseClient(c)

  const { error } = await supabase.from('subject_professors').insert({
    subject_id: subjectId,
    professor_id: professorId,
  })

  if (error) return databaseErrorResponse(c, error)
  return c.json({ success: true, message: 'Professor assigned to subject' })
})

/** Remove a professor from a subject */
internal.delete('/subjects/:id/professors/:professorId', async (c) => {
  const subjectId = requiredParam(c, 'id')
  const professorId = requiredParam(c, 'professorId')
  const supabase = createInternalSupabaseClient(c)

  const { error } = await supabase
    .from('subject_professors')
    .delete()
    .eq('subject_id', subjectId)
    .eq('professor_id', professorId)

  if (error) return databaseErrorResponse(c, error)
  return c.json({ success: true, message: 'Professor removed from subject' })
})

/** List all comments (internal admin view) */
internal.get('/comments', async (c) => {
  const supabase = createInternalSupabaseClient(c)

  const { data, error } = await supabase
    .from('comments')
    .select(`
        *,
        author:profiles(username, full_name),
        professor:professors(name)
      `)
    .order('created_at', { ascending: false })

  if (error) return databaseErrorResponse(c, error)
  return c.json(data)
})

export default internal
