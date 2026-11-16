import { Hono } from 'hono'
import { RATING_CACHE_TAGS } from '../../../shared/config/cache-tags'
import type {
  MyRating,
  RatingStat,
  RatingType,
  RatingUpsertResponse,
} from '../../../shared/types/ratings.types'
import {
  isLocalizedRatingLabel,
  trimRatingLabel,
} from '../../../shared/utils/rating-label.utils'
import { requireAdminAccess } from '../lib/admin-access'
import { revalidateCacheTags } from '../lib/cache-revalidate'
import {
  databaseErrorResponse,
  readJsonBody,
  requiredParam,
} from '../lib/request'
import { requireOwner } from '../lib/require-admin'
import {
  canWriteInStudy,
  STUDY_WRITE_DENIED_MESSAGE,
  studyIdForSubject,
} from '../lib/study-access'
import { authMiddleware, createSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

type RatingTargetType = 'professor' | 'subject'

const isRatingTargetType = (value: unknown): value is RatingTargetType =>
  value === 'professor' || value === 'subject'

const isRatingScore = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= 1 &&
  value <= 5

/** Map a rating insert/update error to a clean HTTP response */
function ratingErrorResponse(error: { code?: string; message: string }) {
  if (error.code === '42501') {
    return {
      body: { error: 'Your account is restricted from rating' },
      status: 403 as const,
    }
  }
  if (error.code === 'P0001') {
    return { body: { error: error.message }, status: 400 as const }
  }
  if (error.code === '23503') {
    return {
      body: { error: 'The item being rated does not exist' },
      status: 409 as const,
    }
  }
  return {
    body: { error: 'Unable to complete the rating request' },
    status: 500 as const,
  }
}

/** Average and count per rating type. Only types with a rating appear. */
function aggregateStats(
  rows: Array<{ rating_type_id: string; score: number }>
): Array<RatingStat> {
  const byType: Record<string, { total: number; count: number }> = {}
  for (const row of rows) {
    const bucket = byType[row.rating_type_id] ?? { total: 0, count: 0 }
    bucket.total += row.score
    bucket.count += 1
    byType[row.rating_type_id] = bucket
  }

  return Object.entries(byType).map(([ratingTypeId, { total, count }]) => ({
    rating_type_id: ratingTypeId,
    average: Math.round((total / count) * 100) / 100,
    count,
  }))
}

const ratings = new Hono<HonoEnv>()

/* ---------------------------------------------------------------------- */
/* Rating types — public read, owner-managed (is_owner() RLS)             */
/* ---------------------------------------------------------------------- */

/** List rating types, optionally filtered by target_type */
ratings.get('/types', async (c) => {
  const supabase = createSupabaseClient(c)
  const targetType = c.req.query('target_type')

  let query = supabase
    .from('rating_types')
    .select('*')
    .order('id', { ascending: true })

  if (targetType) {
    if (!isRatingTargetType(targetType)) {
      return c.json(
        { error: 'target_type must be "professor" or "subject"' },
        400
      )
    }
    query = query.eq('target_type', targetType)
  }

  const { data, error } = await query
  if (error) return databaseErrorResponse(c, error)
  return c.json<Array<RatingType>>(data)
})

ratings.get('/types/:id', async (c) => {
  const id = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('rating_types')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return c.json({ error: 'Rating type not found' }, 404)
  return c.json(data)
})

ratings.post('/types', authMiddleware, requireAdminAccess, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  if (!(await requireOwner(supabase, user.id))) {
    return c.json({ error: 'Unauthorized: Admin access required' }, 403)
  }

  const { id, target_type, labels } = await readJsonBody(c)

  if (
    typeof id !== 'string' ||
    !/^[a-z0-9_]{2,40}$/.test(id) ||
    !isRatingTargetType(target_type) ||
    !isLocalizedRatingLabel(labels)
  ) {
    return c.json(
      {
        error:
          'id (lowercase snake_case), target_type ("professor"|"subject"), and labels ({ "en"?: string, "mk"?: string }, each 2-60 chars, at least one filled) are required',
      },
      400
    )
  }

  const { data, error } = await supabase
    .from('rating_types')
    .insert({ id, target_type, labels: trimRatingLabel(labels) })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return c.json({ error: 'A rating type with this id already exists' }, 409)
    }
    return databaseErrorResponse(c, error)
  }

  await revalidateCacheTags(c.env, [RATING_CACHE_TAGS.types()])

  return c.json({ success: true, rating_type: data })
})

/** Update a rating type's labels (admin only) */
ratings.patch('/types/:id', authMiddleware, requireAdminAccess, async (c) => {
  const user = c.get('user')
  const id = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)

  if (!(await requireOwner(supabase, user.id))) {
    return c.json({ error: 'Unauthorized: Admin access required' }, 403)
  }

  const { labels } = await readJsonBody(c)

  if (!isLocalizedRatingLabel(labels)) {
    return c.json(
      {
        error:
          'labels must be an object keyed by language (at least one of "en"/"mk", each 2-60 characters)',
      },
      400
    )
  }

  const { data, error } = await supabase
    .from('rating_types')
    .update({ labels: trimRatingLabel(labels) })
    .eq('id', id)
    .select()
    .single()

  if (error) return databaseErrorResponse(c, error)

  // The label is part of the cached criteria list the rating widgets read.
  await revalidateCacheTags(c.env, [RATING_CACHE_TAGS.types()])

  return c.json({ success: true, rating_type: data })
})

/** Delete a rating type (admin only) — blocked at the DB by any existing ratings via the FK */
ratings.delete('/types/:id', authMiddleware, requireAdminAccess, async (c) => {
  const user = c.get('user')
  const id = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)

  if (!(await requireOwner(supabase, user.id))) {
    return c.json({ error: 'Unauthorized: Admin access required' }, 403)
  }

  const { error } = await supabase.from('rating_types').delete().eq('id', id)

  if (error) {
    if (error.code === '23503') {
      return c.json(
        { error: 'Cannot delete: still referenced by existing ratings' },
        409
      )
    }
    return databaseErrorResponse(c, error)
  }

  await revalidateCacheTags(c.env, [RATING_CACHE_TAGS.types()])

  return c.json({
    success: true,
    message: 'Rating type deleted successfully',
  })
})

/* ---------------------------------------------------------------------- */
/* Professor ratings                                                      */
/* ---------------------------------------------------------------------- */

/** List all ratings for a professor */
ratings.get('/professor/:professorId', async (c) => {
  const professorId = requiredParam(c, 'professorId')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('professor_ratings')
    .select('*, rating_type:rating_types(id, labels), user:profiles(username)')
    .eq('professor_id', professorId)
    .order('created_at', { ascending: false })

  if (error) return databaseErrorResponse(c, error)
  return c.json(data)
})

/** Get average score per rating type for a professor */
ratings.get('/professor/:professorId/stats', async (c) => {
  const professorId = requiredParam(c, 'professorId')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('professor_ratings')
    .select('rating_type_id, score')
    .eq('professor_id', professorId)

  if (error) return databaseErrorResponse(c, error)
  return c.json<Array<RatingStat>>(aggregateStats(data ?? []))
})

ratings.get('/professor/:professorId/my-ratings', authMiddleware, async (c) => {
  const user = c.get('user')
  const professorId = requiredParam(c, 'professorId')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('professor_ratings')
    .select('*, rating_type:rating_types(id, labels)')
    .eq('professor_id', professorId)
    .eq('user_id', user.id)

  if (error) return databaseErrorResponse(c, error)
  return c.json<Array<MyRating>>(data)
})

/** Add or change the current user's rating of a professor for a given rating type */
ratings.post('/professor/:professorId', authMiddleware, async (c) => {
  const user = c.get('user')
  const professorId = requiredParam(c, 'professorId')
  const supabase = createSupabaseClient(c)

  const { rating_type_id, score } = await readJsonBody(c)

  if (typeof rating_type_id !== 'string' || !isRatingScore(score)) {
    return c.json(
      { error: 'rating_type_id and an integer score (1-5) are required' },
      400
    )
  }

  const { data, error } = await supabase
    .from('professor_ratings')
    .upsert(
      { professor_id: professorId, user_id: user.id, rating_type_id, score },
      { onConflict: 'professor_id,user_id,rating_type_id' }
    )
    .select('*, rating_type:rating_types(id, labels)')
    .single()

  if (error) {
    const { body, status } = ratingErrorResponse(error)
    return c.json(body, status)
  }

  await revalidateCacheTags(c.env, [RATING_CACHE_TAGS.professor(professorId)])

  return c.json<RatingUpsertResponse>({ success: true, rating: data })
})

/** Remove the current user's rating of a professor for a given rating type */
ratings.delete(
  '/professor/:professorId/:ratingTypeId',
  authMiddleware,
  async (c) => {
    const user = c.get('user')
    const professorId = requiredParam(c, 'professorId')
    const ratingTypeId = requiredParam(c, 'ratingTypeId')
    const supabase = createSupabaseClient(c)

    const { error } = await supabase
      .from('professor_ratings')
      .delete()
      .eq('professor_id', professorId)
      .eq('user_id', user.id)
      .eq('rating_type_id', ratingTypeId)

    if (error) return databaseErrorResponse(c, error)

    await revalidateCacheTags(c.env, [RATING_CACHE_TAGS.professor(professorId)])

    return c.json({ success: true })
  }
)

/* ---------------------------------------------------------------------- */
/* Subject ratings                                                        */
/* ---------------------------------------------------------------------- */

/** List all ratings for a subject */
ratings.get('/subject/:subjectId', async (c) => {
  const subjectId = requiredParam(c, 'subjectId')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('subject_ratings')
    .select('*, rating_type:rating_types(id, labels), user:profiles(username)')
    .eq('subject_id', subjectId)
    .order('created_at', { ascending: false })

  if (error) return databaseErrorResponse(c, error)
  return c.json(data)
})

/** Get average score per rating type for a subject */
ratings.get('/subject/:subjectId/stats', async (c) => {
  const subjectId = requiredParam(c, 'subjectId')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('subject_ratings')
    .select('rating_type_id, score')
    .eq('subject_id', subjectId)

  if (error) return databaseErrorResponse(c, error)
  return c.json<Array<RatingStat>>(aggregateStats(data ?? []))
})

ratings.get('/subject/:subjectId/my-ratings', authMiddleware, async (c) => {
  const user = c.get('user')
  const subjectId = requiredParam(c, 'subjectId')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('subject_ratings')
    .select('*, rating_type:rating_types(id, labels)')
    .eq('subject_id', subjectId)
    .eq('user_id', user.id)

  if (error) return databaseErrorResponse(c, error)
  return c.json<Array<MyRating>>(data)
})

/** Add or change the current user's rating of a subject for a given rating type */
ratings.post('/subject/:subjectId', authMiddleware, async (c) => {
  const user = c.get('user')
  const subjectId = requiredParam(c, 'subjectId')
  const supabase = createSupabaseClient(c)

  // A subject belongs to one study, so rating it is a write on that study.
  const studyId = await studyIdForSubject(supabase, subjectId)
  if (!studyId) return c.json({ error: 'Subject not found' }, 404)
  if (!(await canWriteInStudy(supabase, user.id, studyId))) {
    return c.json({ error: STUDY_WRITE_DENIED_MESSAGE }, 403)
  }

  const { rating_type_id, score } = await readJsonBody(c)

  if (typeof rating_type_id !== 'string' || !isRatingScore(score)) {
    return c.json(
      { error: 'rating_type_id and an integer score (1-5) are required' },
      400
    )
  }

  const { data, error } = await supabase
    .from('subject_ratings')
    .upsert(
      { subject_id: subjectId, user_id: user.id, rating_type_id, score },
      { onConflict: 'subject_id,user_id,rating_type_id' }
    )
    .select('*, rating_type:rating_types(id, labels)')
    .single()

  if (error) {
    const { body, status } = ratingErrorResponse(error)
    return c.json(body, status)
  }

  await revalidateCacheTags(c.env, [RATING_CACHE_TAGS.subject(subjectId)])

  return c.json<RatingUpsertResponse>({ success: true, rating: data })
})

/** Remove the current user's rating of a subject for a given rating type */
ratings.delete(
  '/subject/:subjectId/:ratingTypeId',
  authMiddleware,
  async (c) => {
    const user = c.get('user')
    const subjectId = requiredParam(c, 'subjectId')
    const ratingTypeId = requiredParam(c, 'ratingTypeId')
    const supabase = createSupabaseClient(c)

    const { error } = await supabase
      .from('subject_ratings')
      .delete()
      .eq('subject_id', subjectId)
      .eq('user_id', user.id)
      .eq('rating_type_id', ratingTypeId)

    if (error) return databaseErrorResponse(c, error)

    await revalidateCacheTags(c.env, [RATING_CACHE_TAGS.subject(subjectId)])

    return c.json({ success: true })
  }
)

export default ratings
