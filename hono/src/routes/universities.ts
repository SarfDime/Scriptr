import { Hono } from 'hono'
import { requiredParam } from '../lib/request'
import { createInternalSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const R2_BUCKET_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/

/** Map a Postgres error to a clean HTTP response. */
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
      return { status: 500 as const, body: { error: error.message } }
  }
}

function isValidR2BucketId(value: unknown): value is string {
  return typeof value === 'string' && R2_BUCKET_ID_PATTERN.test(value)
}

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
  const supabase = createInternalSupabaseClient(c)

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
  const supabase = createInternalSupabaseClient(c)

  const { data, error } = await supabase
    .from('universities')
    .select('*, faculties:faculties(*)')
    .eq('id', universityId)
    .single()

  if (error) return c.json({ error: error.message }, 404)
  return c.json(data)
})

/** Create a new university */
universities.post('/', async (c) => {
  const body = await c.req.json<Record<string, unknown>>()
  const { name, sanity_id: sanityId, r2_bucket_id: r2BucketId } = body

  if (typeof name !== 'string' || name.trim().length === 0) {
    return c.json({ error: 'name is required' }, 400)
  }

  if (r2BucketId !== undefined && !isValidR2BucketId(r2BucketId)) {
    return c.json(
      { error: 'r2_bucket_id must be a valid R2/S3 bucket name' },
      400
    )
  }

  const supabase = createInternalSupabaseClient(c)

  const { data, error } = await supabase
    .from('universities')
    .insert({
      name,
      sanity_id: typeof sanityId === 'string' ? sanityId : null,
      r2_bucket_id: r2BucketId ?? null,
    })
    .select('*')
    .single()

  if (error) {
    const { status, body: errorBody } = mapPostgresError(error)
    return c.json(errorBody, status)
  }

  return c.json({ university: data }, 201)
})

/** Update a university */
universities.patch('/:id', async (c) => {
  const universityId = requiredParam(c, 'id')
  const body = await c.req.json<Record<string, unknown>>()
  const { name, r2_bucket_id: r2BucketId } = body

  if (
    name !== undefined &&
    (typeof name !== 'string' || name.trim().length === 0)
  ) {
    return c.json({ error: 'name must be a non-empty string' }, 400)
  }

  if (
    r2BucketId !== undefined &&
    r2BucketId !== null &&
    !isValidR2BucketId(r2BucketId)
  ) {
    return c.json(
      { error: 'r2_bucket_id must be a valid R2/S3 bucket name' },
      400
    )
  }

  const update: { name?: string; r2_bucket_id?: string | null } = {}
  if (name !== undefined) update.name = name
  if (r2BucketId !== undefined) update.r2_bucket_id = r2BucketId

  if (Object.keys(update).length === 0) {
    return c.json({ error: 'No updatable fields provided' }, 400)
  }

  const supabase = createInternalSupabaseClient(c)

  const { data, error } = await supabase
    .from('universities')
    .update(update)
    .eq('id', universityId)
    .select('*')
    .single()

  if (error) {
    const { status, body: errorBody } = mapPostgresError(error)
    return c.json(errorBody, status)
  }

  return c.json({ university: data })
})

/** Re-sync a university's editorial fields from Sanity */
universities.post('/:id/sync', async (c) => {
  const universityId = requiredParam(c, 'id')
  const body = await c.req.json<Record<string, unknown>>()
  const { name, r2_bucket_id: r2BucketId } = body

  if (typeof name !== 'string' || name.trim().length === 0) {
    return c.json({ error: 'name is required' }, 400)
  }

  if (
    r2BucketId !== undefined &&
    r2BucketId !== null &&
    !isValidR2BucketId(r2BucketId)
  ) {
    return c.json(
      { error: 'r2_bucket_id must be a valid R2/S3 bucket name' },
      400
    )
  }

  const update: { name: string; r2_bucket_id?: string | null } = { name }
  if (r2BucketId !== undefined) update.r2_bucket_id = r2BucketId

  const supabase = createInternalSupabaseClient(c)

  const { data, error } = await supabase
    .from('universities')
    .update(update)
    .eq('id', universityId)
    .select('*')
    .single()

  if (error) {
    const { status, body: errorBody } = mapPostgresError(error)
    return c.json(errorBody, status)
  }

  return c.json({ university: data })
})

/** Delete a university (blocked if any faculties still reference it) */
universities.delete('/:id', async (c) => {
  const universityId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)

  const { data: dependentFaculties, error: dependentsError } = await supabase
    .from('faculties')
    .select('id')
    .eq('university_id', universityId)
    .limit(1)

  if (dependentsError) {
    return c.json({ error: dependentsError.message }, 500)
  }

  if (dependentFaculties && dependentFaculties.length > 0) {
    return c.json(
      { error: 'This university still has faculties and cannot be deleted' },
      409
    )
  }

  const { error } = await supabase
    .from('universities')
    .delete()
    .eq('id', universityId)

  if (error) {
    const { status, body: errorBody } = mapPostgresError(
      error,
      'This university still has dependents.'
    )
    return c.json(errorBody, status)
  }

  return c.json({ success: true, message: 'University deleted successfully' })
})

export default universities
