import { Hono } from 'hono'
import { authMiddleware, createSupabaseClient } from '../lib/supabase'
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

  if (profile?.role !== 'moderator') {
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

  if (profile?.role !== 'moderator') {
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
  const status = c.req.param('status')
  const supabase = createSupabaseClient(c)

  // Validate status
  if (!['pending', 'reviewed', 'dismissed'].includes(status)) {
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

  if (profile?.role !== 'moderator') {
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

  if (!['user', 'script'].includes(target_type)) {
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
    .eq('target_type', target_type)
    .eq('target_id', target_id)
    .eq('status', 'pending')
    .single()

  if (existingFlag) {
    return c.json({ error: 'You have already flagged this item' }, 400)
  }

  const { data, error } = await supabase
    .from('flags')
    .insert({
      reporter_id: user.id,
      target_type,
      target_id,
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

/** Update flag status (moderator only) */
flags.patch('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const flagId = c.req.param('id')
  const supabase = createSupabaseClient(c)

  // Check if user is moderator
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'moderator') {
    return c.json({ error: 'Unauthorized: Moderator access required' }, 403)
  }

  const { status } = await c.req.json()

  if (!['pending', 'reviewed', 'dismissed'].includes(status)) {
    return c.json(
      { error: 'Invalid status. Must be: pending, reviewed, or dismissed' },
      400
    )
  }

  const { data, error } = await supabase
    .from('flags')
    .update({ status })
    .eq('id', flagId)
    .select(`
      *,
      reporter:profiles!reporter_id(username, full_name)
    `)
    .single()

  if (error) return c.json({ error: error.message }, 500)

  // If flag is dismissed and target is a script, check if there are other pending flags
  if (status === 'dismissed' && data.target_type === 'script') {
    const { data: otherFlags } = await supabase
      .from('flags')
      .select('id')
      .eq('target_type', 'script')
      .eq('target_id', data.target_id)
      .eq('status', 'pending')

    // If no other pending flags, remove the flagged status
    if (!otherFlags || otherFlags.length === 0) {
      await supabase
        .from('scripts')
        .update({ is_flagged: false })
        .eq('id', data.target_id)
    }
  }

  return c.json({ success: true, flag: data })
})

/** Delete a flag (moderator only) */
flags.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const flagId = c.req.param('id')
  const supabase = createSupabaseClient(c)

  // Check if user is moderator
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'moderator') {
    return c.json({ error: 'Unauthorized: Moderator access required' }, 403)
  }

  const { error } = await supabase.from('flags').delete().eq('id', flagId)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, message: 'Flag deleted successfully' })
})

export default flags
