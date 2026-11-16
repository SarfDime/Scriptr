import { isOwner } from '@shared/utils/api.utils'
import { Hono } from 'hono'
import { NOTIFICATION_ROW_STRINGS } from '../../../shared/strings/notifications-strings'
import type {
  LiftedRestrictionItem,
  MyRestriction,
  RestrictionListItem,
  RestrictionLookupResponse,
  RestrictionMutationResponse,
} from '../../../shared/types/restrictions.types'
import { createRateLimiter } from '../../../shared/utils/rate-limit'
import { requireAdminAccess } from '../lib/admin-access'
import { honoLog } from '../lib/logger'
import { notifyProfileBestEffort } from '../lib/notifications'
import {
  databaseErrorResponse,
  readJsonBody,
  requiredParam,
} from '../lib/request'
import { computeRestrictionExpiry } from '../lib/restrictions'
import { authMiddleware, createSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const RESTRICTION_COLUMNS =
  'profile_id, restricted_by, reason, created_at, expires_at, profile:profiles!profile_id(username, full_name), restricted_by_profile:profiles!restricted_by(username, full_name)'

const isActiveRestriction = (expiresAt: string | null, now: number) =>
  expiresAt === null || new Date(expiresAt).getTime() > now

const OWN_RESTRICTION_LIMIT = 15
const OWN_RESTRICTION_WINDOW_MS = 60_000

const isOwnRestrictionLimited = createRateLimiter({
  limit: OWN_RESTRICTION_LIMIT,
  windowMs: OWN_RESTRICTION_WINDOW_MS,
})

const restrictions = new Hono<HonoEnv>()

restrictions.use('*', authMiddleware)

const requireAdmin = async (c: Parameters<typeof createSupabaseClient>[0]) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error)
    return { supabase, user, response: databaseErrorResponse(c, error) }
  if (!isOwner(profile?.role)) {
    return {
      supabase,
      user,
      response: c.json({ error: 'Unauthorized: Admin access required' }, 403),
    }
  }
  return { supabase, user, response: null }
}

/** List active and lapsed restriction rows (admin only). */
restrictions.get('/', requireAdminAccess, async (c) => {
  const access = await requireAdmin(c)
  if (access.response) return access.response

  const { data, error } = await access.supabase
    .from('profile_restrictions')
    .select(RESTRICTION_COLUMNS)
    .order('created_at', { ascending: false })

  if (error) return databaseErrorResponse(c, error)
  const now = Date.now()
  const result: Array<RestrictionListItem> = data.map((restriction) => ({
    ...restriction,
    active: isActiveRestriction(restriction.expires_at, now),
  }))
  return c.json<Array<RestrictionListItem>>(result)
})

/** Restrictions an admin lifted early, newest first (admin only). */
restrictions.get('/lifted', requireAdminAccess, async (c) => {
  const access = await requireAdmin(c)
  if (access.response) return access.response

  const { data, error } = await access.supabase
    .from('profile_restriction_history')
    .select(
      'id, profile_id, restricted_by, reason, created_at, expires_at, lifted_early_at, profile:profiles!profile_id(username, full_name), restricted_by_profile:profiles!restricted_by(username, full_name)'
    )
    .not('lifted_early_at', 'is', null)
    .order('lifted_early_at', { ascending: false })

  if (error) return databaseErrorResponse(c, error)
  return c.json<Array<LiftedRestrictionItem>>(
    data.flatMap(({ lifted_early_at, ...row }) =>
      lifted_early_at ? [{ ...row, lifted_early_at }] : []
    )
  )
})

restrictions.get('/me', async (c) => {
  const user = c.get('user')
  if (isOwnRestrictionLimited(user.id)) {
    return c.json({ error: 'Too many requests. Please slow down.' }, 429)
  }
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('profile_restrictions')
    .select('profile_id, restricted_by, reason, created_at, expires_at')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (error) return databaseErrorResponse(c, error)
  return c.json<MyRestriction>(
    data && isActiveRestriction(data.expires_at, Date.now()) ? data : null
  )
})

/** Find a profile and its ladder position for the admin restriction dialog. */
restrictions.get('/lookup', requireAdminAccess, async (c) => {
  const access = await requireAdmin(c)
  if (access.response) return access.response

  const username = c.req.query('username')?.trim().toLowerCase()
  const profileId = c.req.query('profile_id')?.trim()
  if ((!username && !profileId) || (username && profileId)) {
    return c.json(
      { error: 'Provide exactly one of username or profile_id' },
      400
    )
  }

  let profileQuery = access.supabase
    .from('profiles')
    .select('id, username, full_name, role')
  profileQuery = username
    ? profileQuery.eq('username', username)
    : profileQuery.eq('id', profileId as string)
  const { data: profile, error: profileError } =
    await profileQuery.maybeSingle()
  if (profileError) return databaseErrorResponse(c, profileError)
  if (!profile) return c.json({ error: 'Profile not found' }, 404)
  if (isOwner(profile.role)) {
    return c.json({ error: 'Admin accounts cannot be restricted' }, 400)
  }

  const [
    { count, error: historyError },
    { data: restriction, error: restrictionError },
  ] = await Promise.all([
    access.supabase
      .from('profile_restriction_history')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', profile.id)
      .is('lifted_early_at', null),
    access.supabase
      .from('profile_restrictions')
      .select('profile_id, restricted_by, reason, created_at, expires_at')
      .eq('profile_id', profile.id)
      .maybeSingle(),
  ])
  if (historyError) return databaseErrorResponse(c, historyError)
  if (restrictionError) return databaseErrorResponse(c, restrictionError)

  const activeRestriction =
    restriction && isActiveRestriction(restriction.expires_at, Date.now())
      ? restriction
      : null
  const { role: _role, ...profileSummary } = profile
  return c.json<RestrictionLookupResponse>({
    profile: profileSummary,
    prior_count: count ?? 0,
    active_restriction: activeRestriction,
  })
})

restrictions.get('/:profileId', async (c) => {
  const profileId = requiredParam(c, 'profileId')
  const supabase = createSupabaseClient(c)

  // No owner check on purpose: RLS — not this route — decides who may read a
  // restriction, and an unrelated caller simply gets `null`.
  const { data, error } = await supabase
    .from('profile_restrictions')
    .select(RESTRICTION_COLUMNS)
    .eq('profile_id', profileId)
    .maybeSingle()

  if (error) return databaseErrorResponse(c, error)
  return c.json(
    data && isActiveRestriction(data.expires_at, Date.now()) ? data : null
  )
})

/** Apply a restriction, or update only the reason of an active restriction. */
restrictions.put('/:profileId', requireAdminAccess, async (c) => {
  const access = await requireAdmin(c)
  if (access.response) return access.response

  const profileId = requiredParam(c, 'profileId')
  const { reason } = await readJsonBody(c)
  if (
    typeof reason !== 'string' ||
    reason.trim().length < 3 ||
    reason.trim().length > 500
  ) {
    return c.json({ error: 'reason must be between 3 and 500 characters' }, 400)
  }

  const { data: targetProfile, error: targetError } = await access.supabase
    .from('profiles')
    .select('id, role')
    .eq('id', profileId)
    .maybeSingle()
  if (targetError) return databaseErrorResponse(c, targetError)
  if (!targetProfile) return c.json({ error: 'Profile not found' }, 404)
  if (isOwner(targetProfile.role)) {
    return c.json({ error: 'Admin accounts cannot be restricted' }, 400)
  }

  const now = Date.now()
  const { data: existing, error: existingError } = await access.supabase
    .from('profile_restrictions')
    .select('profile_id, expires_at')
    .eq('profile_id', profileId)
    .maybeSingle()
  if (existingError) return databaseErrorResponse(c, existingError)

  if (existing && isActiveRestriction(existing.expires_at, now)) {
    const { data, error } = await access.supabase
      .from('profile_restrictions')
      .update({ reason: reason.trim() })
      .eq('profile_id', profileId)
      .select('profile_id, restricted_by, reason, created_at, expires_at')
      .single()
    if (error) return databaseErrorResponse(c, error)
    return c.json<RestrictionMutationResponse>({
      success: true,
      restriction: data,
    })
  }

  const { count, error: historyError } = await access.supabase
    .from('profile_restriction_history')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', profileId)
    .is('lifted_early_at', null)
  if (historyError) return databaseErrorResponse(c, historyError)

  const expiresAt = computeRestrictionExpiry(count ?? 0, new Date(now))
  const normalizedReason = reason.trim()
  const { data, error } = await access.supabase
    .from('profile_restrictions')
    .upsert(
      {
        profile_id: profileId,
        restricted_by: access.user.id,
        reason: normalizedReason,
        expires_at: expiresAt,
      },
      { onConflict: 'profile_id' }
    )
    .select('profile_id, restricted_by, reason, created_at, expires_at')
    .single()
  if (error) return databaseErrorResponse(c, error)

  const { error: insertHistoryError } = await access.supabase
    .from('profile_restriction_history')
    .insert({
      profile_id: profileId,
      restricted_by: access.user.id,
      reason: normalizedReason,
      expires_at: expiresAt,
    })
  if (insertHistoryError) {
    honoLog({
      logLevel: 'error',
      message: 'Restriction applied but its history row could not be inserted',
      error: insertHistoryError,
    })
    return databaseErrorResponse(c, insertHistoryError)
  }

  await notifyProfileBestEffort(c, profileId, {
    type: 'restriction_applied',
    title: NOTIFICATION_ROW_STRINGS.restrictionAppliedTitle,
    body: NOTIFICATION_ROW_STRINGS.restrictionAppliedBody(
      normalizedReason,
      expiresAt
    ),
    data: { reason: normalizedReason, expires_at: expiresAt },
  })
  return c.json<RestrictionMutationResponse>({
    success: true,
    restriction: data,
  })
})

/** Lift a user's restriction (admin only). */
restrictions.delete('/:profileId', requireAdminAccess, async (c) => {
  const access = await requireAdmin(c)
  if (access.response) return access.response

  const profileId = requiredParam(c, 'profileId')
  const now = Date.now()
  const { data: existing, error: existingError } = await access.supabase
    .from('profile_restrictions')
    .select('profile_id, expires_at')
    .eq('profile_id', profileId)
    .maybeSingle()
  if (existingError) return databaseErrorResponse(c, existingError)
  if (!existing) {
    return c.json({ error: 'This user is not currently restricted' }, 404)
  }

  const active = isActiveRestriction(existing.expires_at, now)
  if (active) {
    const { data: latestHistory, error: historyError } = await access.supabase
      .from('profile_restriction_history')
      .select('id')
      .eq('profile_id', profileId)
      .is('lifted_early_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (historyError) return databaseErrorResponse(c, historyError)
    if (latestHistory) {
      const { error } = await access.supabase
        .from('profile_restriction_history')
        .update({ lifted_early_at: new Date(now).toISOString() })
        .eq('id', latestHistory.id)
        .is('lifted_early_at', null)
      if (error) return databaseErrorResponse(c, error)
    }
  }

  const { data, error } = await access.supabase
    .from('profile_restrictions')
    .delete()
    .eq('profile_id', profileId)
    .select('profile_id')
    .maybeSingle()
  if (error) return databaseErrorResponse(c, error)
  if (!data) {
    return c.json({ error: 'This user is not currently restricted' }, 404)
  }

  if (active) {
    await notifyProfileBestEffort(c, profileId, {
      type: 'restriction_lifted',
      title: NOTIFICATION_ROW_STRINGS.restrictionLiftedTitle,
      body: NOTIFICATION_ROW_STRINGS.restrictionLiftedBody,
      data: null,
    })
  }
  return c.json<{ success: true }>({ success: true })
})

export default restrictions
