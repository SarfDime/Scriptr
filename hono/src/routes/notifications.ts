import { Hono } from 'hono'
import type { NotificationRecord } from '../../../shared/types/api.types'
import { databaseErrorResponse, requiredParam } from '../lib/request'
import { authMiddleware, createSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const notifications = new Hono<HonoEnv>()

notifications.use('*', authMiddleware)
/** List the current user's notifications, optionally filtered by read state */
notifications.get('/', async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)
  const isRead = c.req.query('is_read')

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })

  if (isRead === 'true') query = query.eq('is_read', true)
  if (isRead === 'false') query = query.eq('is_read', false)

  const { data, error } = await query
  if (error) return databaseErrorResponse(c, error)
  return c.json<Array<NotificationRecord>>(data ?? [])
})
/** Get the current user's unread notification count */
notifications.get('/unread-count', async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', user.id)
    .eq('is_read', false)

  if (error) return databaseErrorResponse(c, error)
  return c.json<{ count: number }>({ count: count ?? 0 })
})

/** Mark all of the current user's unread notifications as read */
notifications.patch('/read-all', async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('profile_id', user.id)
    .eq('is_read', false)

  if (error) return databaseErrorResponse(c, error)
  return c.json<{ success: true }>({ success: true })
})

/** Update the read state of one of the current user's notifications */
notifications.patch('/:id', async (c) => {
  const user = c.get('user')
  const notificationId = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)
  const { is_read } = await c.req.json<{ is_read?: unknown }>()

  if (typeof is_read !== 'boolean') {
    return c.json({ error: 'is_read must be a boolean' }, 400)
  }

  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read })
    .eq('id', notificationId)
    .eq('profile_id', user.id)
    .select()
    .single()

  if (error) return c.json({ error: 'Notification not found' }, 404)
  return c.json<NotificationRecord>(data)
})

/** Delete one of the current user's notifications */
notifications.delete('/:id', async (c) => {
  const user = c.get('user')
  const notificationId = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('profile_id', user.id)

  if (error) return databaseErrorResponse(c, error)
  return c.json<{ success: true }>({ success: true })
})

export default notifications
