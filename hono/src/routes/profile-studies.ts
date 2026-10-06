import { Hono } from 'hono'
import { profileMutationTags } from '../../../shared/config/cache-tags'
import type { ProfileStudySelection } from '../../../shared/types/profile.types'
import { revalidateCacheTags } from '../lib/cache-revalidate'
import { requiredParam } from '../lib/request'
import { authMiddleware, createSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const profileStudies = new Hono<HonoEnv>()

profileStudies.use('*', authMiddleware)

/** List the current user's selected studies */
profileStudies.get('/', async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)
  const { data, error } = await supabase
    .from('profile_studies')
    .select(
      'study_id, created_at, study:studies(*, faculty:faculties(*, university:universities(id, name)))'
    )
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  await revalidateCacheTags(c.env, profileMutationTags(user.id))
  return c.json<Array<ProfileStudySelection>>(data ?? [])
})

/** Get the current user's selection record for a study, or null */
profileStudies.get('/:studyId', async (c) => {
  const user = c.get('user')
  const studyId = requiredParam(c, 'studyId')
  const supabase = createSupabaseClient(c)
  const { data, error } = await supabase
    .from('profile_studies')
    .select(
      'study_id, created_at, study:studies(*, faculty:faculties(*, university:universities(id, name)))'
    )
    .eq('profile_id', user.id)
    .eq('study_id', studyId)
    .maybeSingle()

  if (error) return c.json({ error: error.message }, 500)
  return c.json<ProfileStudySelection | null>(data)
})

/** Add a study to the current user's selections (idempotent) */
profileStudies.post('/:studyId', async (c) => {
  const user = c.get('user')
  const studyId = requiredParam(c, 'studyId')
  const supabase = createSupabaseClient(c)
  const { data, error } = await supabase
    .from('profile_studies')
    .upsert(
      { profile_id: user.id, study_id: studyId },
      { onConflict: 'profile_id,study_id' }
    )
    .select(
      'study_id, created_at, study:studies(*, faculty:faculties(*, university:universities(id, name)))'
    )
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json<ProfileStudySelection>(data)
})

/** Remove a study from the current user's selections */
profileStudies.delete('/:studyId', async (c) => {
  const user = c.get('user')
  const studyId = requiredParam(c, 'studyId')
  const supabase = createSupabaseClient(c)
  const { error } = await supabase
    .from('profile_studies')
    .delete()
    .eq('profile_id', user.id)
    .eq('study_id', studyId)

  if (error) return c.json({ error: error.message }, 500)
  await revalidateCacheTags(c.env, profileMutationTags(user.id))
  return c.json<{ success: true }>({ success: true })
})

export default profileStudies
