import { isProfileSubjectStatus } from '@shared/utils/api.utils'
import { Hono } from 'hono'
import { profileMutationTags } from '../../../shared/config/cache-tags'
import type { ProfileSubjectSelection } from '../../../shared/types/profile.types'
import { revalidateCacheTags } from '../lib/cache-revalidate'
import { databaseErrorResponse, requiredParam } from '../lib/request'
import { authMiddleware, createSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const profileSubjects = new Hono<HonoEnv>()

profileSubjects.use('*', authMiddleware)

/** List the current user's subjects and their statuses */
profileSubjects.get('/', async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)
  const { data, error } = await supabase
    .from('profile_subjects')
    .select('subject_id, status, updated_at, subject:subjects(*)')
    .eq('profile_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) return databaseErrorResponse(c, error)
  return c.json<Array<ProfileSubjectSelection>>(data ?? [])
})

/** Get one of the current user's subject status records, or null */
profileSubjects.get('/:subjectId', async (c) => {
  const user = c.get('user')
  const subjectId = requiredParam(c, 'subjectId')
  const supabase = createSupabaseClient(c)
  const { data, error } = await supabase
    .from('profile_subjects')
    .select('subject_id, status, updated_at, subject:subjects(*)')
    .eq('profile_id', user.id)
    .eq('subject_id', subjectId)
    .maybeSingle()

  if (error) return databaseErrorResponse(c, error)
  return c.json<ProfileSubjectSelection | null>(data)
})

/** Create or replace the current user's status for a subject */
profileSubjects.put('/:subjectId', async (c) => {
  const user = c.get('user')
  const subjectId = requiredParam(c, 'subjectId')
  const { status } = await c.req.json<{ status?: unknown }>()

  if (!isProfileSubjectStatus(status)) {
    return c.json(
      { error: 'Status must be completed or currently_taking' },
      400
    )
  }

  const supabase = createSupabaseClient(c)
  const { data, error } = await supabase
    .from('profile_subjects')
    .upsert(
      { profile_id: user.id, subject_id: subjectId, status },
      { onConflict: 'profile_id,subject_id' }
    )
    .select('subject_id, status, updated_at, subject:subjects(*)')
    .single()

  if (error) return databaseErrorResponse(c, error)
  await revalidateCacheTags(c.env, profileMutationTags(user.id))
  return c.json<ProfileSubjectSelection>(data)
})

/** Remove the current user's status for a subject */
profileSubjects.delete('/:subjectId', async (c) => {
  const user = c.get('user')
  const subjectId = requiredParam(c, 'subjectId')
  const supabase = createSupabaseClient(c)
  const { error } = await supabase
    .from('profile_subjects')
    .delete()
    .eq('profile_id', user.id)
    .eq('subject_id', subjectId)

  if (error) return databaseErrorResponse(c, error)
  await revalidateCacheTags(c.env, profileMutationTags(user.id))
  return c.json<{ success: true }>({ success: true })
})

export default profileSubjects
