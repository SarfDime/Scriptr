import { Hono } from 'hono'
import {
  isFlagStatus,
  isFlagTargetType,
  isUserRole,
} from '../../../shared/utils/api.utils'
import { requiredParam } from '../lib/request'
import {
  authMiddleware,
  createInternalSupabaseClient,
  createSupabaseClient,
} from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const flags = new Hono<HonoEnv>()

/** Get all flags (moderator only) */
flags.get('/', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  // Check if user is moderator
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isUserRole(profile?.role) || profile.role !== 'moderator') {
    return c.json({ error: 'Unauthorized: Moderator access required' }, 403)
  }

  const { data, error } = await supabase
    .from('flags')
    .select(`
      *,
      reporter:profiles!reporter_id(username, full_name)
    `)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

/** Get pending flags (moderator only) */
flags.get('/pending', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  // Check if user is moderator
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isUserRole(profile?.role) || profile.role !== 'moderator') {
    return c.json({ error: 'Unauthorized: Moderator access required' }, 403)
  }

  const { data, error } = await supabase
    .from('flags')
    .select(`
      *,
      reporter:profiles!reporter_id(username, full_name)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

/** Get flags by status (moderator only) */
flags.get('/status/:status', authMiddleware, async (c) => {
  const user = c.get('user')
  const status = requiredParam(c, 'status')
  const supabase = createSupabaseClient(c)

  // Validate status
  if (!isFlagStatus(status)) {
    return c.json(
      { error: 'Invalid status. Must be: pending, reviewed, or dismissed' },
      400
    )
  }

  // Check if user is moderator
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isUserRole(profile?.role) || profile.role !== 'moderator') {
    return c.json({ error: 'Unauthorized: Moderator access required' }, 403)
  }

  const { data, error } = await supabase
    .from('flags')
    .select(`
      *,
      reporter:profiles!reporter_id(username, full_name)
    `)
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

/** Create a new flag */
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
      { error: 'target_type must be either "user" or "script"' },
      400
    )
  }

  if (reason.trim().length < 10) {
    return c.json({ error: 'Reason must be at least 10 characters long' }, 400)
  }

  // Check if user already flagged this target
  const { data: existingFlag } = await supabase
    .from('flags')
    .select('id')
    .eq('reporter_id', user.id)
    .eq(
      target_type === 'script' ? 'target_script_id' : 'target_user_id',
      target_id
    )
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
      reason,
      status: 'pending',
    })
    .select(`
      *,
      reporter:profiles!reporter_id(username, full_name)
    `)
    .single()

  if (error) return c.json({ error: error.message }, 500)

  // If target is a script, mark it as flagged
  if (target_type === 'script') {
    await supabase
      .from('scripts')
      .update({ is_flagged: true })
      .eq('id', target_id)
  }

  return c.json({ success: true, flag: data })
})

/** Update flag status (only the flag owner may update their own flag) */
flags.patch('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const flagId = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)
  const adminSupabase = createInternalSupabaseClient(c)

  const { data: existingFlag, error: existingFlagError } = await supabase
    .from('flags')
    .select('reporter_id, target_script_id')
    .eq('id', flagId)
    .single()

  if (existingFlagError || !existingFlag) {
    return c.json({ error: 'Flag not found' }, 404)
  }

  if (existingFlag.reporter_id !== user.id) {
    return c.json(
      { error: 'Forbidden: You can only update your own flags' },
      403
    )
  }

  const { status } = await c.req.json()

  if (!isFlagStatus(status)) {
    return c.json(
      { error: 'Invalid status. Must be: pending, reviewed, or dismissed' },
      400
    )
  }

  const { data, error } = await adminSupabase
    .from('flags')
    .update({ status })
    .eq('id', flagId)
    .select(`
      *,
      reporter:profiles!reporter_id(username, full_name)
    `)
    .single()

  if (error) return c.json({ error: error.message }, 500)

  if (status === 'dismissed' && data.target_script_id) {
    const { data: otherFlags } = await adminSupabase
      .from('flags')
      .select('id')
      .eq('target_script_id', data.target_script_id)
      .eq('status', 'pending')

    if (!otherFlags || otherFlags.length === 0) {
      await adminSupabase
        .from('scripts')
        .update({ is_flagged: false })
        .eq('id', data.target_script_id)
    }
  }

  return c.json({ success: true, flag: data })
})

/** Delete a flag (only the flag owner may delete their own flag) */
flags.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const flagId = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)
  const adminSupabase = createInternalSupabaseClient(c)

  const { data: existingFlag, error: existingFlagError } = await supabase
    .from('flags')
    .select('reporter_id')
    .eq('id', flagId)
    .single()

  if (existingFlagError || !existingFlag) {
    return c.json({ error: 'Flag not found' }, 404)
  }

  if (existingFlag.reporter_id !== user.id) {
    return c.json(
      { error: 'Forbidden: You can only delete your own flags' },
      403
    )
  }

  const { error } = await adminSupabase.from('flags').delete().eq('id', flagId)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, message: 'Flag deleted successfully' })
})

export default flags
