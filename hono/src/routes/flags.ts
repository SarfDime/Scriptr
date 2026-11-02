import {
  isAdmin,
  isFlagStatus,
  isFlagTargetType,
} from '@shared/utils/api.utils'
import {
  isPortableTextValue,
  portableTextToPlainText,
} from '@shared/utils/portable-text.utils'
import { type Context, Hono } from 'hono'
import type { Json } from '../../../shared/types/database.types'
import type {
  AdminFlag,
  FlagCreateResponse,
  FlagListResponse,
  FlagMutationResponse,
} from '../../../shared/types/flags.types'
import { honoLog } from '../lib/logger'
import { notifyAdminsAtFlagThreshold } from '../lib/notifications'
import {
  databaseErrorResponse,
  readJsonBody,
  requiredParam,
} from '../lib/request'
import {
  authMiddleware,
  createInternalSupabaseClient,
  createSupabaseClient,
} from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const flags = new Hono<HonoEnv>()

type FlagWithReporter = Omit<AdminFlag, 'target'>

const plainText = (content: Json, fallback: string) =>
  isPortableTextValue(content)
    ? portableTextToPlainText(content).trim() || fallback
    : fallback

/** `is_flagged` has no column grant for `authenticated` (it is internal
 * moderation state), so no RLS path exists for the caller. The routes authorize
 * the action first; this write then goes through the service-role client. */
const setContentFlagged = async (
  c: Context<HonoEnv>,
  type: 'script' | 'comment',
  id: string,
  flagged: boolean
) => {
  const supabase = createInternalSupabaseClient(c)
  const { error } =
    type === 'script'
      ? await supabase
          .from('scripts')
          .update({ is_flagged: flagged })
          .eq('id', id)
      : await supabase
          .from('comments')
          .update({ is_flagged: flagged })
          .eq('id', id)
  if (error) {
    honoLog({
      logLevel: 'error',
      message: `Flag state changed but the ${type} could not be marked ${flagged ? 'flagged' : 'unflagged'}`,
      error,
    })
  }
}

const resolveAdminFlags = async (
  supabase: ReturnType<typeof createSupabaseClient>,
  rows: Array<FlagWithReporter>
): Promise<FlagListResponse | null> => {
  const scriptIds = rows.flatMap((row) =>
    row.target_script_id ? [row.target_script_id] : []
  )
  const commentIds = rows.flatMap((row) =>
    row.target_comment_id ? [row.target_comment_id] : []
  )
  const userIds = rows.flatMap((row) =>
    row.target_user_id ? [row.target_user_id] : []
  )

  const [scriptResult, commentResult, userResult] = await Promise.all([
    scriptIds.length
      ? supabase
          .from('scripts')
          .select('id, title, author_id')
          .in('id', scriptIds)
      : Promise.resolve({ data: [], error: null }),
    commentIds.length
      ? supabase
          .from('comments')
          .select('id, content, parent_id, script_id, professor_id, author_id')
          .in('id', commentIds)
      : Promise.resolve({ data: [], error: null }),
    userIds.length
      ? supabase
          .from('profiles')
          .select('id, username, full_name')
          .in('id', userIds)
      : Promise.resolve({ data: [], error: null }),
  ])
  const queryError =
    scriptResult.error ?? commentResult.error ?? userResult.error
  if (queryError) return null

  const commentRows = commentResult.data ?? []
  const parentIds = commentRows.flatMap((row) =>
    row.parent_id ? [row.parent_id] : []
  )
  const parentResult = parentIds.length
    ? await supabase
        .from('comments')
        .select('id, script_id, professor_id')
        .in('id', parentIds)
    : { data: [], error: null }
  if (parentResult.error) return null

  const scriptsById = new Map(
    (scriptResult.data ?? []).map((script) => [script.id, script])
  )
  const commentsById = new Map(
    commentRows.map((comment) => [comment.id, comment])
  )
  const parentById = new Map(
    (parentResult.data ?? []).map((comment) => [comment.id, comment])
  )
  const profilesById = new Map(
    (userResult.data ?? []).map((profile) => [profile.id, profile])
  )

  const contextScriptIds = [
    ...commentRows.flatMap((comment) =>
      comment.script_id ? [comment.script_id] : []
    ),
    ...(parentResult.data ?? []).flatMap((comment) =>
      comment.script_id ? [comment.script_id] : []
    ),
  ]
  const contextProfessorIds = [
    ...commentRows.flatMap((comment) =>
      comment.professor_id ? [comment.professor_id] : []
    ),
    ...(parentResult.data ?? []).flatMap((comment) =>
      comment.professor_id ? [comment.professor_id] : []
    ),
  ]
  const [contextScripts, professors] = await Promise.all([
    contextScriptIds.length
      ? supabase.from('scripts').select('id, title').in('id', contextScriptIds)
      : Promise.resolve({ data: [], error: null }),
    contextProfessorIds.length
      ? supabase
          .from('professors')
          .select('id, name')
          .in('id', contextProfessorIds)
      : Promise.resolve({ data: [], error: null }),
  ])
  if (contextScripts.error || professors.error) return null

  const contextScriptById = new Map(
    (contextScripts.data ?? []).map((script) => [script.id, script])
  )
  const professorsById = new Map(
    (professors.data ?? []).map((professor) => [professor.id, professor])
  )

  return rows.map((row): AdminFlag => {
    let target: AdminFlag['target'] = null
    if (row.target_script_id) {
      const script = scriptsById.get(row.target_script_id)
      if (script) {
        target = {
          kind: 'script',
          id: script.id,
          label: plainText(script.title, 'Untitled script'),
          href: `/scripts/${script.id}`,
          author_id: script.author_id,
        }
      }
    } else if (row.target_comment_id) {
      const comment = commentsById.get(row.target_comment_id)
      if (comment) {
        const parent = comment.parent_id
          ? parentById.get(comment.parent_id)
          : undefined
        const context =
          comment.script_id || comment.professor_id ? comment : parent
        const script = context?.script_id
          ? contextScriptById.get(context.script_id)
          : undefined
        const professor = context?.professor_id
          ? professorsById.get(context.professor_id)
          : undefined
        let href = '/admin/flags'
        if (script) href = `/scripts/${script.id}`
        else if (professor) href = `/professor/${professor.id}`
        const contextLabel = script
          ? plainText(script.title, 'script')
          : (professor?.name ?? 'professor')
        target = {
          kind: 'comment',
          id: comment.id,
          label: `${plainText(comment.content, 'Comment')} (${contextLabel})`,
          href,
          author_id: comment.author_id,
        }
      }
    } else if (row.target_user_id) {
      const profile = profilesById.get(row.target_user_id)
      if (profile) {
        target = {
          kind: 'user',
          id: profile.id,
          label: profile.username
            ? `${profile.full_name ?? profile.username} (@${profile.username})`
            : (profile.full_name ?? `User ${profile.id}`),
          href: profile.username
            ? `/user/${encodeURIComponent(profile.username)}`
            : '/admin/flags',
          author_id: null,
        }
      }
    }
    return { ...row, target }
  })
}

const listAdminFlags = async (c: Context<HonoEnv>, status?: string) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError) return databaseErrorResponse(c, profileError)
  if (!isAdmin(profile?.role)) {
    return c.json({ error: 'Unauthorized: Admin access required' }, 403)
  }

  let query = supabase
    .from('flags')
    .select(`*, reporter:profiles!reporter_id(username, full_name)`)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) return databaseErrorResponse(c, error)
  const rows: Array<FlagWithReporter> = []
  for (const row of data) {
    if (!isFlagStatus(row.status)) {
      honoLog({
        logLevel: 'error',
        message: 'A flag row has an invalid status',
        error: new Error(`Invalid flag status: ${row.status}`),
      })
      return c.json({ error: 'Unable to load flags' }, 500)
    }
    rows.push({ ...row, status: row.status })
  }
  const adminFlags = await resolveAdminFlags(supabase, rows)
  if (!adminFlags) {
    return databaseErrorResponse(c, {
      message: 'Failed to resolve flag targets',
    })
  }
  return c.json<FlagListResponse>(adminFlags)
}

/** Get all flags (admin only) — RLS now grants admins SELECT directly */
flags.get('/', authMiddleware, (c) => listAdminFlags(c))

/** Get pending flags (admin only) */
flags.get('/pending', authMiddleware, (c) => listAdminFlags(c, 'pending'))

/** Get flags by status (admin only) */
flags.get('/status/:status', authMiddleware, async (c) => {
  const status = requiredParam(c, 'status')
  if (!isFlagStatus(status)) {
    return c.json(
      { error: 'Invalid status. Must be: pending, reviewed, or dismissed' },
      400
    )
  }
  return listAdminFlags(c, status)
})

/** Get my submitted flags */
flags.get('/my-flags', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('flags')
    .select('*')
    .eq('reporter_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return databaseErrorResponse(c, error)
  return c.json(data)
})

/** Create a new flag. Restriction is enforced at the RLS layer (is_restricted()). */
flags.post('/', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  const { target_type, target_id, reason } = await readJsonBody(c)

  if (
    typeof target_type !== 'string' ||
    typeof target_id !== 'string' ||
    typeof reason !== 'string' ||
    !target_type ||
    !target_id ||
    !reason
  ) {
    return c.json(
      { error: 'target_type, target_id, and reason are required' },
      400
    )
  }

  if (!isFlagTargetType(target_type)) {
    return c.json(
      { error: 'target_type must be "user", "script", or "comment"' },
      400
    )
  }

  if (reason.trim().length < 10) {
    return c.json({ error: 'Reason must be at least 10 characters long' }, 400)
  }

  let targetHref = '/admin/flags'
  if (target_type === 'script' || target_type === 'comment') {
    if (target_type === 'script') {
      const { data: target, error: targetError } = await supabase
        .from('scripts')
        .select('author_id')
        .eq('id', target_id)
        .maybeSingle()
      if (targetError) return databaseErrorResponse(c, targetError)
      if (!target) return c.json({ error: 'script not found' }, 404)
      if (target.author_id === user.id) {
        return c.json({ error: 'You cannot report your own script' }, 403)
      }
      targetHref = `/scripts/${target_id}`
    } else {
      const { data: target, error: targetError } = await supabase
        .from('comments')
        .select('author_id, script_id, professor_id')
        .eq('id', target_id)
        .maybeSingle()
      if (targetError) return databaseErrorResponse(c, targetError)
      if (!target) return c.json({ error: 'comment not found' }, 404)
      if (target.author_id === user.id) {
        return c.json({ error: 'You cannot report your own comment' }, 403)
      }
      if (target.script_id) {
        targetHref = `/scripts/${target.script_id}`
      } else if (target.professor_id) {
        targetHref = `/professor/${target.professor_id}`
      } else {
        targetHref = '/admin/flags'
      }
    }
  } else {
    const { data: target, error: targetError } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', target_id)
      .maybeSingle()
    if (targetError) return databaseErrorResponse(c, targetError)
    if (!target) return c.json({ error: 'user not found' }, 404)
    if (target.username) {
      targetHref = `/user/${encodeURIComponent(target.username)}`
    }
  }

  let targetColumn: 'target_script_id' | 'target_comment_id' | 'target_user_id'
  if (target_type === 'script') {
    targetColumn = 'target_script_id'
  } else if (target_type === 'comment') {
    targetColumn = 'target_comment_id'
  } else {
    targetColumn = 'target_user_id'
  }

  const { data: existingFlag } = await supabase
    .from('flags')
    .select('id')
    .eq('reporter_id', user.id)
    .eq(targetColumn, target_id)
    .eq('status', 'pending')
    .maybeSingle()

  if (existingFlag) {
    return c.json({ error: 'You have already flagged this item' }, 400)
  }

  const { data, error } = await supabase
    .from('flags')
    .insert({
      reporter_id: user.id,
      target_script_id: target_type === 'script' ? target_id : null,
      target_user_id: target_type === 'user' ? target_id : null,
      target_comment_id: target_type === 'comment' ? target_id : null,
      reason,
      status: 'pending',
    })
    .select(`*, reporter:profiles!reporter_id(username, full_name)`)
    .single()

  // A restricted user's insert fails RLS (is_restricted() check), surfacing here as a
  // generic Postgres error — map it to a clear 403 instead of a raw 500.
  if (error) {
    if (error.code === '42501') {
      return c.json(
        { error: 'Your account is restricted from filing flags' },
        403
      )
    }
    return databaseErrorResponse(c, error)
  }

  if (target_type === 'script' || target_type === 'comment') {
    await setContentFlagged(c, target_type, target_id, true)
  }

  await notifyAdminsAtFlagThreshold(c, target_type, target_id, targetHref)

  return c.json<FlagCreateResponse>({
    success: true,
    flag: data,
  })
})

/** Resolve a flag's status (admin only). */
flags.patch('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const flagId = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAdmin(profile?.role)) {
    return c.json({ error: 'Unauthorized: Admin access required' }, 403)
  }

  // Admins now have SELECT RLS on flags, so the session client can read any row.
  const { data: existingFlag, error: existingFlagError } = await supabase
    .from('flags')
    .select('reporter_id, target_script_id, target_comment_id, status')
    .eq('id', flagId)
    .single()

  if (existingFlagError || !existingFlag) {
    return c.json({ error: 'Flag not found' }, 404)
  }

  const { status } = await readJsonBody(c)

  if (!isFlagStatus(status)) {
    return c.json(
      { error: 'Invalid status. Must be: pending, reviewed, or dismissed' },
      400
    )
  }

  let reviewFields: {
    reviewed_by?: string | null
    reviewed_at?: string | null
  } = {}
  if (status === 'pending') {
    reviewFields = { reviewed_by: null, reviewed_at: null }
  } else if (existingFlag.status !== status) {
    reviewFields = {
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    }
  }

  const { data, error } = await supabase
    .from('flags')
    .update({ status, ...reviewFields })
    .eq('id', flagId)
    .select(`*, reporter:profiles!reporter_id(username, full_name)`)
    .single()

  if (error) return databaseErrorResponse(c, error)

  if (status === 'dismissed') {
    let target: {
      type: 'script' | 'comment'
      id: string
      column: 'target_script_id' | 'target_comment_id'
    } | null = null
    if (data.target_script_id) {
      target = {
        type: 'script',
        id: data.target_script_id,
        column: 'target_script_id',
      }
    } else if (data.target_comment_id) {
      target = {
        type: 'comment',
        id: data.target_comment_id,
        column: 'target_comment_id',
      }
    }
    if (target) {
      const { data: otherFlags } = await supabase
        .from('flags')
        .select('id')
        .eq(target.column, target.id)
        .eq('status', 'pending')
      if (!otherFlags || otherFlags.length === 0) {
        await setContentFlagged(c, target.type, target.id, false)
      }
    }
  }

  const [updatedFlag] =
    (await resolveAdminFlags(supabase, [{ ...data, status }])) ?? []
  if (!updatedFlag) {
    return databaseErrorResponse(c, {
      message: 'Failed to resolve updated flag target',
    })
  }
  return c.json<FlagMutationResponse>({
    success: true,
    flag: updatedFlag,
  })
})

/** Delete a flag (the reporter, or now an admin) */
flags.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const flagId = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)

  const { data: existingFlag, error: existingFlagError } = await supabase
    .from('flags')
    .select('reporter_id')
    .eq('id', flagId)
    .single()

  if (existingFlagError || !existingFlag) {
    return c.json({ error: 'Flag not found' }, 404)
  }

  if (existingFlag.reporter_id !== user.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!isAdmin(profile?.role)) {
      return c.json(
        { error: 'Forbidden: You can only delete your own flags' },
        403
      )
    }
  }

  const { error } = await supabase.from('flags').delete().eq('id', flagId)

  if (error) return databaseErrorResponse(c, error)
  return c.json({ success: true, message: 'Flag deleted successfully' })
})

export default flags
