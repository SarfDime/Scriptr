import { Hono } from 'hono'
import { profileMutationTags } from '../../../shared/config/cache-tags'
import { isUserRole } from '../../../shared/utils/api.utils'
import { requireAdminAccess } from '../lib/admin-access'
import { revalidateCacheTags } from '../lib/cache-revalidate'
import {
  databaseErrorResponse,
  readJsonBody,
  requiredParam,
} from '../lib/request'
import { requireAdmin } from '../lib/require-admin'
import { authMiddleware, createSupabaseClient } from '../lib/supabase'
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
 * The profiles UPDATE policy is `id = auth.uid() or is_admin()`, so the session
 * client can make this change and RLS stays the real boundary; the explicit
 * check only turns a rejection into a clean 403. */
protectedAdmin.patch('/profiles/:id/role', authMiddleware, async (c) => {
  const user = c.get('user')
  const targetId = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)

  if (!(await requireAdmin(supabase, user.id))) {
    return c.json({ error: 'Unauthorized: Admin access required' }, 403)
  }

  const body = await readJsonBody(c)
  if (!isUserRole(body.role)) {
    return c.json(
      { error: 'Role must be "student", "moderator", or "admin"' },
      400
    )
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ role: body.role })
    .eq('id', targetId)
    .select()
    .single()

  if (error) return databaseErrorResponse(c, error)

  await revalidateCacheTags(c.env, profileMutationTags(targetId))
  return c.json({ success: true, profile: data })
})

export default protectedAdmin
