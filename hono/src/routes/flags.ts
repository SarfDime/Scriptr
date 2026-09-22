import {
  isAdmin,
  isFlagStatus,
  isFlagTargetType,
} from '@shared/utils/api.utils'
import { Hono } from 'hono'
import { requiredParam } from '../lib/request'
import { authMiddleware, createSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const flags = new Hono<HonoEnv>()

/** Get all flags (admin only) — RLS now grants admins SELECT directly */
flags.get('/', authMiddleware, async (c) => {
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
    .from('flags')
    .select(`*, reporter:profiles!reporter_id(username, full_name)`)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

/** Get pending flags (admin only) */
flags.get('/pending', authMiddleware, async (c) => {
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
    .from('flags')
    .select(`*, reporter:profiles!reporter_id(username, full_name)`)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

/** Get flags by status (admin only) */
flags.get('/status/:status', authMiddleware, async (c) => {
  const user = c.get('user')
  const status = requiredParam(c, 'status')
  const supabase = createSupabaseClient(c)

  if (!isFlagStatus(status)) {
    return c.json(
      { error: 'Invalid status. Must be: pending, reviewed, or dismissed' },
      400
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAdmin(profile?.role)) {
    return c.json({ error: 'Unauthorized: Admin access required' }, 403)
  }

  const { data, error } = await supabase
    .from('flags')
    .select(`*, reporter:profiles!reporter_id(username, full_name)`)
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
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

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

/** Create a new flag. Restriction is enforced at the RLS layer (is_restricted()). */
flags.post('/', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  const { target_type, target_id, reason } = await c.req.json()

  if (!target_type || !target_id || !reason) {
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
    .single()

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
    return c.json({ error: error.message }, 500)
  }

  if (target_type === 'script') {
    await supabase
      .from('scripts')
      .update({ is_flagged: true })
      .eq('id', target_id)
  } else if (target_type === 'comment') {
    await supabase
      .from('comments')
      .update({ is_flagged: true })
      .eq('id', target_id)
  }

  return c.json({ success: true, flag: data })
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
    .select('reporter_id, target_script_id, target_comment_id')
    .eq('id', flagId)
    .single()

  if (existingFlagError || !existingFlag) {
    return c.json({ error: 'Flag not found' }, 404)
  }

  const { status } = await c.req.json()

  if (!isFlagStatus(status)) {
    return c.json(
      { error: 'Invalid status. Must be: pending, reviewed, or dismissed' },
      400
    )
  }

  const { data, error } = await supabase
    .from('flags')
    .update({ status })
    .eq('id', flagId)
    .select(`*, reporter:profiles!reporter_id(username, full_name)`)
    .single()

  if (error) return c.json({ error: error.message }, 500)

  if (status === 'dismissed' && data.target_script_id) {
    const { data: otherFlags } = await supabase
      .from('flags')
      .select('id')
      .eq('target_script_id', data.target_script_id)
      .eq('status', 'pending')

    if (!otherFlags || otherFlags.length === 0) {
      await supabase
        .from('scripts')
        .update({ is_flagged: false })
        .eq('id', data.target_script_id)
    }
  }

  if (status === 'dismissed' && data.target_comment_id) {
    const { data: otherFlags } = await supabase
      .from('flags')
      .select('id')
      .eq('target_comment_id', data.target_comment_id)
      .eq('status', 'pending')

    if (!otherFlags || otherFlags.length === 0) {
      await supabase
        .from('comments')
        .update({ is_flagged: false })
        .eq('id', data.target_comment_id)
    }
  }

  return c.json({ success: true, flag: data })
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

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, message: 'Flag deleted successfully' })
})

export default flags
