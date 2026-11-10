import { Hono } from 'hono'
import { profileMutationTags } from '../../../shared/config/cache-tags'
import {
  ANNOUNCEMENT_BODY_MAX_LENGTH,
  ANNOUNCEMENT_TITLE_MAX_LENGTH,
} from '../../../shared/config/shared-constants'
import type {
  AdminStudiesResponse,
  AdminStudyRoleResponse,
} from '../../../shared/types/admin.types'
import type { BroadcastNotificationResponse } from '../../../shared/types/notifications.types'
import type {
  AdminProfileRoleResponse,
  StudyRole,
} from '../../../shared/types/profile.types'
import {
  isOwner,
  isStudyRole,
  isUserRole,
} from '../../../shared/utils/api.utils'
import { createRateLimiter } from '../../../shared/utils/rate-limit'
import { isUuid } from '../../../shared/utils/slug.utils'
import { requireAdminAccess } from '../lib/admin-access'
import { revalidateCacheTags } from '../lib/cache-revalidate'
import { honoLog } from '../lib/logger'
import {
  databaseErrorResponse,
  exceedsBodyLimit,
  MAX_JSON_BODY_BYTES,
  readJsonBody,
  requiredParam,
} from '../lib/request'
import { requireOwner, requireStudyRole } from '../lib/require-admin'
import { studyExists } from '../lib/study-access'
import {
  authMiddleware,
  createInternalSupabaseClient,
  createSupabaseClient,
} from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

/**
 * Routes on the website's admin surface that change something.
 *
 * Mounted by `./admin.ts`. `requireAdminAccess` (shared with the site's other
 * admin routes) pins the origin and demands a live unlock token; each route
 * also requires an admin session, so the token proves the operator unlocked the
 * surface and the session identifies who is acting and keeps RLS in force.
 */
const protectedAdmin = new Hono<HonoEnv>()

protectedAdmin.use('*', requireAdminAccess)

/** Change another user's role.
 *
 * Written with the service-role client, unlike the rest of this surface.
 * `authenticated` holds column-level UPDATE on `(username, full_name)` only —
 * `20261029120000_revoke_profile_avatar_url_write.sql` dropped the table-wide
 * grant and granted the writable columns back — so a session-client write of
 * `role` is refused with `42501` before RLS is even consulted. Granting the
 * column would be worse: RLS lets a caller update their **own** row, so every
 * user could promote themselves. The role therefore has no session path at
 * all, and the gates above it are the boundary: origin + unlock token
 * (`requireAdminAccess`), an admin session, and the explicit admin check the
 * service-role client makes unavoidable. */
protectedAdmin.patch('/profiles/:id/role', authMiddleware, async (c) => {
  const user = c.get('user')
  const targetId = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)

  if (!(await requireOwner(supabase, user.id))) {
    return c.json({ error: 'Unauthorized: Admin access required' }, 403)
  }

  const body = await readJsonBody(c)
  if (!isUserRole(body.role)) {
    return c.json(
      { error: 'Role must be "student" or "owner". Study roles are separate.' },
      400
    )
  }

  const { data, error } = await createInternalSupabaseClient(c)
    .from('profiles')
    .update({ role: body.role })
    .eq('id', targetId)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return c.json({ error: 'Profile not found' }, 404)
    }
    return databaseErrorResponse(c, error)
  }

  await revalidateCacheTags(c.env, profileMutationTags(targetId))
  return c.json<AdminProfileRoleResponse>({ success: true, profile: data })
})

/** Broadcasts are one insert per profile, so they are the one admin action
 * worth throttling: ten an hour is far more than an operator needs and keeps a
 * stuck button from writing a million rows. */
const isBroadcastLimited = createRateLimiter({
  limit: 10,
  windowMs: 60 * 60 * 1000,
})

/** Read ids in pages, then insert in chunks: one unbounded `select` of the
 * whole profiles table would be a single large response, and one unbounded
 * insert a single large statement. */
const RECIPIENT_PAGE_SIZE = 1000
const NOTIFICATION_INSERT_SIZE = 500

/** Send one `announcement` notification to every profile, or to one study's
 * people when `studyId` names a study.
 *
 * The recipient ids are read with the service-role client (a plain read of a
 * publicly readable table, done in pages), and the rows are written with the
 * caller's session client, so the `admins can create notifications` INSERT
 * policy stays the boundary on every row.
 *
 * A study announcement goes to everyone enrolled in it, everyone holding a role
 * on it, and every owner — an owner answers for every study, so leaving them out
 * would hide the one thing they are meant to see. The rows carry `study_id`, so
 * that study's site shows them and the other studies' sites do not.
 *
 * An owner may address everyone or any study; a study admin only a study they
 * administer, which the insert policy enforces as well. */
protectedAdmin.post('/notifications', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  if (await exceedsBodyLimit(c, MAX_JSON_BODY_BYTES)) {
    return c.json({ error: 'Request body is too large' }, 413)
  }

  const body = await readJsonBody(c)
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (title.length < 1 || title.length > ANNOUNCEMENT_TITLE_MAX_LENGTH) {
    return c.json(
      {
        error: `Enter a title between 1 and ${ANNOUNCEMENT_TITLE_MAX_LENGTH} characters`,
      },
      400
    )
  }

  let studyId: string | null = null
  if (body.studyId !== undefined && body.studyId !== null) {
    if (typeof body.studyId !== 'string' || !isUuid(body.studyId)) {
      return c.json({ error: 'studyId must be a study id, or null' }, 400)
    }
    if (!(await studyExists(supabase, body.studyId))) {
      return c.json({ error: 'That study was not found' }, 400)
    }
    studyId = body.studyId
  }

  const rawBody = typeof body.body === 'string' ? body.body.trim() : ''
  if (rawBody.length > ANNOUNCEMENT_BODY_MAX_LENGTH) {
    return c.json(
      {
        error: `Enter a message of at most ${ANNOUNCEMENT_BODY_MAX_LENGTH} characters`,
      },
      400
    )
  }

  // Who may address whom: an owner to everyone or any study, a study admin to
  // their own study only. The insert policy applies the same rule, so this only
  // turns a database rejection into a clear 403.
  const isOwnerUser = await requireOwner(supabase, user.id)
  if (!isOwnerUser) {
    if (!studyId) {
      return c.json({ error: 'Only an owner can announce to everyone' }, 403)
    }
    if (!(await requireStudyRole(supabase, user.id, studyId, 'admin'))) {
      return c.json(
        { error: 'Unauthorized: You do not administer that study' },
        403
      )
    }
  }

  // Checked after validation: a rejected form should not use up one of the
  // operator's few sends.
  if (isBroadcastLimited(user.id)) {
    return c.json(
      { error: 'Too many announcements. Please wait before sending another.' },
      429
    )
  }

  const announcement = {
    type: 'announcement',
    title,
    body: rawBody || null,
    study_id: studyId,
  }
  const internal = createInternalSupabaseClient(c)
  let recipients = 0

  const deliver = async (profileIds: Array<string>) => {
    for (
      let index = 0;
      index < profileIds.length;
      index += NOTIFICATION_INSERT_SIZE
    ) {
      const chunk = profileIds.slice(index, index + NOTIFICATION_INSERT_SIZE)
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(
          chunk.map((profileId) => ({
            profile_id: profileId,
            ...announcement,
          }))
        )

      if (insertError) throw insertError
      recipients += chunk.length
    }
  }

  const failDelivery = (error: { code?: string; message: string }) => {
    honoLog({
      logLevel: 'error',
      message: `Announcement delivery stopped after ${recipients} recipients`,
      error,
    })
    return databaseErrorResponse(c, error)
  }

  if (studyId) {
    const [members, staff, owners] = await Promise.all([
      internal
        .from('profile_studies')
        .select('profile_id')
        .eq('study_id', studyId),
      internal.from('study_roles').select('profile_id').eq('study_id', studyId),
      internal.from('profiles').select('id').eq('role', 'owner'),
    ])
    const readError = members.error ?? staff.error ?? owners.error
    if (readError) return failDelivery(readError)

    const recipientIds = [
      ...new Set([
        ...(members.data ?? []).map((row) => row.profile_id),
        ...(staff.data ?? []).map((row) => row.profile_id),
        ...(owners.data ?? []).map((row) => row.id),
      ]),
    ]

    try {
      await deliver(recipientIds)
    } catch (error) {
      return failDelivery(error as { code?: string; message: string })
    }
  } else {
    let offset = 0

    for (;;) {
      const { data: page, error } = await internal
        .from('profiles')
        .select('id')
        .order('id', { ascending: true })
        .range(offset, offset + RECIPIENT_PAGE_SIZE - 1)

      if (error) return databaseErrorResponse(c, error)
      if (!page || page.length === 0) break

      try {
        await deliver(page.map((profile) => profile.id))
      } catch (error) {
        return failDelivery(error as { code?: string; message: string })
      }

      offset += page.length
      if (page.length < RECIPIENT_PAGE_SIZE) break
    }
  }

  honoLog({
    logLevel: 'info',
    message: `Admin ${user.id} announced to ${recipients} profiles${
      studyId ? ` in study ${studyId}` : ''
    }`,
  })

  return c.json<BroadcastNotificationResponse>({ success: true, recipients })
})

/**
 * The studies this caller can manage, for the admin switcher. An owner gets
 * every study with `role: "owner"`; anyone else gets the studies they hold a
 * role on, with that role.
 */
protectedAdmin.get('/studies', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  const [
    { data: profile, error: profileError },
    { data: roles, error: rolesError },
  ] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase
      .from('study_roles')
      .select('study_id, role')
      .eq('profile_id', user.id),
  ])

  if (profileError) return databaseErrorResponse(c, profileError)
  if (rolesError) return databaseErrorResponse(c, rolesError)

  const owner = isOwner(profile?.role)
  const allowedIds = (roles ?? []).map((role) => role.study_id)

  if (!owner && allowedIds.length === 0) {
    return c.json<AdminStudiesResponse>({ studies: [] })
  }

  let studyQuery = supabase
    .from('studies')
    .select(
      'id, name, site_slug, faculty:faculties(id, name, university:universities(id, name))'
    )
    .order('name', { ascending: true })

  if (!owner) studyQuery = studyQuery.in('id', allowedIds)

  const { data: studies, error: studiesError } = await studyQuery
  if (studiesError) return databaseErrorResponse(c, studiesError)

  const roleByStudy = new Map(
    (roles ?? []).map((role) => [role.study_id, role.role])
  )

  const roleFor = (studyId: string): StudyRole | 'owner' => {
    if (owner) return 'owner'
    const role = roleByStudy.get(studyId)
    return isStudyRole(role) ? role : 'moderator'
  }

  return c.json<AdminStudiesResponse>({
    studies: (studies ?? []).map((study) => ({
      id: study.id,
      name: study.name,
      siteSlug: study.site_slug,
      facultyName: study.faculty?.name ?? '',
      universityName: study.faculty?.university?.name ?? '',
      role: roleFor(study.id),
    })),
  })
})

/** Grant or replace one study role. Owners only: a study admin cannot promote
 * anyone, including themselves, beyond the study they already hold. */
protectedAdmin.put('/profiles/:id/study-roles', authMiddleware, async (c) => {
  const user = c.get('user')
  const targetId = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)

  if (!(await requireOwner(supabase, user.id))) {
    return c.json({ error: 'Unauthorized: Owner access required' }, 403)
  }

  const body = await readJsonBody(c)
  if (typeof body.study_id !== 'string' || !isStudyRole(body.role)) {
    return c.json(
      { error: 'study_id and role ("admin" or "moderator") are required' },
      400
    )
  }

  const { data, error } = await supabase
    .from('study_roles')
    .upsert(
      {
        profile_id: targetId,
        study_id: body.study_id,
        role: body.role,
        granted_by: user.id,
      },
      { onConflict: 'profile_id,study_id' }
    )
    .select('study_id, role')
    .single()

  if (error) return databaseErrorResponse(c, error)

  return c.json<AdminStudyRoleResponse>({
    success: true,
    studyRole: {
      studyId: data.study_id,
      role: isStudyRole(data.role) ? data.role : 'moderator',
    },
  })
})

protectedAdmin.delete(
  '/profiles/:id/study-roles/:studyId',
  authMiddleware,
  async (c) => {
    const user = c.get('user')
    const targetId = requiredParam(c, 'id')
    const studyId = requiredParam(c, 'studyId')
    const supabase = createSupabaseClient(c)

    if (!(await requireOwner(supabase, user.id))) {
      return c.json({ error: 'Unauthorized: Owner access required' }, 403)
    }

    const { error } = await supabase
      .from('study_roles')
      .delete()
      .eq('profile_id', targetId)
      .eq('study_id', studyId)

    if (error) return databaseErrorResponse(c, error)
    return c.json({ success: true })
  }
)

export default protectedAdmin
