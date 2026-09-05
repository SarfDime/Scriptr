import { Hono } from 'hono'
import { isProfileSubjectStatus } from '../../../shared/utils/api.utils'
import { requiredParam } from '../lib/request'
import { authMiddleware, createSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const profileSubjects = new Hono<HonoEnv>()

profileSubjects.use('*', authMiddleware)

profileSubjects.get('/', async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)
  const { data, error } = await supabase
    .from('profile_subjects')
    .select('subject_id, status, updated_at, subject:subjects(*)')
    .eq('profile_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

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

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

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

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

profileSubjects.delete('/:subjectId', async (c) => {
  const user = c.get('user')
  const subjectId = requiredParam(c, 'subjectId')
  const supabase = createSupabaseClient(c)
  const { error } = await supabase
    .from('profile_subjects')
    .delete()
    .eq('profile_id', user.id)
    .eq('subject_id', subjectId)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

export default profileSubjects
