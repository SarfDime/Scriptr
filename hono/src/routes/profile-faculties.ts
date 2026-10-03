import { Hono } from 'hono'
import { profileMutationTags } from '../../../shared/config/cache-tags'
import { revalidateCacheTags } from '../lib/cache-revalidate'
import { requiredParam } from '../lib/request'
import { authMiddleware, createSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const profileFaculties = new Hono<HonoEnv>()

profileFaculties.use('*', authMiddleware)

/** List the current user's selected faculties */
profileFaculties.get('/', async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)
  const { data, error } = await supabase
    .from('profile_faculties')
    .select(
      'faculty_id, created_at, faculty:faculties(*, university:universities(id, name))'
    )
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  await revalidateCacheTags(c.env, profileMutationTags(user.id))
  return c.json(data)
})

/** Get the current user's selection record for a faculty, or null */
profileFaculties.get('/:facultyId', async (c) => {
  const user = c.get('user')
  const facultyId = requiredParam(c, 'facultyId')
  const supabase = createSupabaseClient(c)
  const { data, error } = await supabase
    .from('profile_faculties')
    .select(
      'faculty_id, created_at, faculty:faculties(*, university:universities(id, name))'
    )
    .eq('profile_id', user.id)
    .eq('faculty_id', facultyId)
    .maybeSingle()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

/** Add a faculty to the current user's selections (idempotent) */
profileFaculties.post('/:facultyId', async (c) => {
  const user = c.get('user')
  const facultyId = requiredParam(c, 'facultyId')
  const supabase = createSupabaseClient(c)
  const { data, error } = await supabase
    .from('profile_faculties')
    .upsert(
      { profile_id: user.id, faculty_id: facultyId },
      { onConflict: 'profile_id,faculty_id' }
    )
    .select(
      'faculty_id, created_at, faculty:faculties(*, university:universities(id, name))'
    )
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

/** Remove a faculty from the current user's selections */
profileFaculties.delete('/:facultyId', async (c) => {
  const user = c.get('user')
  const facultyId = requiredParam(c, 'facultyId')
  const supabase = createSupabaseClient(c)
  const { error } = await supabase
    .from('profile_faculties')
    .delete()
    .eq('profile_id', user.id)
    .eq('faculty_id', facultyId)

  if (error) return c.json({ error: error.message }, 500)
  await revalidateCacheTags(c.env, profileMutationTags(user.id))
  return c.json({ success: true })
})

export default profileFaculties
