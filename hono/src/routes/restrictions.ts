import { isAdmin } from '@shared/utils/api.utils'
import { Hono } from 'hono'
import { databaseErrorResponse, requiredParam } from '../lib/request'
import { authMiddleware, createSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const RESTRICTION_COLUMNS =
  'profile_id, restricted_by, reason, created_at, profile:profiles!profile_id(username, full_name), restricted_by_profile:profiles!restricted_by(username, full_name)'

const restrictions = new Hono<HonoEnv>()

restrictions.use('*', authMiddleware)

/** Get all active restrictions (admin only) */
restrictions.get('/', async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAdmin(profile?.role)) {
    return c.json({ error: 'Unauthorized: Admin access required' }, 403)
  }

  const { data, error } = await supabase
    .from('profile_restrictions')
    .select(RESTRICTION_COLUMNS)
    .order('created_at', { ascending: false })

  if (error) return databaseErrorResponse(c, error)
  return c.json(data)
})

/** Get the current user's own restriction status, or null */
restrictions.get('/me', async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('profile_restrictions')
    .select('profile_id, restricted_by, reason, created_at')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (error) return databaseErrorResponse(c, error)
  return c.json(data)
})

/** Get a specific profile's restriction status. RLS limits this to the
 * profile owner or an admin — a non-admin querying someone else's status
 * simply gets null back, same as an unrestricted user. */
restrictions.get('/:profileId', async (c) => {
  const profileId = requiredParam(c, 'profileId')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('profile_restrictions')
    .select(RESTRICTION_COLUMNS)
    .eq('profile_id', profileId)
    .maybeSingle()

  if (error) return databaseErrorResponse(c, error)
  return c.json(data)
})

/** Restrict a user, or update the reason on an existing restriction (admin only) */
restrictions.put('/:profileId', async (c) => {
  const user = c.get('user')
  const profileId = requiredParam(c, 'profileId')
  const supabase = createSupabaseClient(c)

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAdmin(profile?.role)) {
    return c.json({ error: 'Unauthorized: Admin access required' }, 403)
  }

  const { reason } = await c.req.json<{ reason?: unknown }>()

  if (
    typeof reason !== 'string' ||
    reason.trim().length < 3 ||
    reason.trim().length > 500
  ) {
    return c.json({ error: 'reason must be between 3 and 500 characters' }, 400)
  }

  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', profileId)
    .single()

  if (!targetProfile) {
    return c.json({ error: 'Profile not found' }, 404)
  }

  const { data, error } = await supabase
    .from('profile_restrictions')
    .upsert(
      {
        profile_id: profileId,
        restricted_by: user.id,
        reason: reason.trim(),
      },
      { onConflict: 'profile_id' }
    )
    .select(RESTRICTION_COLUMNS)
    .single()

  if (error) return databaseErrorResponse(c, error)
  return c.json({ success: true, restriction: data })
})

/** Lift a user's restriction (admin only) */
restrictions.delete('/:profileId', async (c) => {
  const user = c.get('user')
  const profileId = requiredParam(c, 'profileId')
  const supabase = createSupabaseClient(c)

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAdmin(profile?.role)) {
    return c.json({ error: 'Unauthorized: Admin access required' }, 403)
  }

  const { data, error } = await supabase
    .from('profile_restrictions')
    .delete()
    .eq('profile_id', profileId)
    .select('profile_id')
    .maybeSingle()

  if (error) return databaseErrorResponse(c, error)
  if (!data) {
    return c.json({ error: 'This user is not currently restricted' }, 404)
  }

  return c.json({ success: true, message: 'Restriction lifted successfully' })
})

export default restrictions
