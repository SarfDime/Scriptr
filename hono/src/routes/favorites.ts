import { Hono } from 'hono'
import { requiredParam } from '../lib/request'
import { authMiddleware, createSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const favorites = new Hono<HonoEnv>()

favorites.use('*', authMiddleware)

favorites.get('/', async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)
  const { data, error } = await supabase
    .from('script_favorites')
    .select('created_at, script:scripts(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

favorites.get('/:scriptId', async (c) => {
  const user = c.get('user')
  const scriptId = requiredParam(c, 'scriptId')
  const supabase = createSupabaseClient(c)
  const { data, error } = await supabase
    .from('script_favorites')
    .select('created_at, script:scripts(*)')
    .eq('user_id', user.id)
    .eq('script_id', scriptId)
    .maybeSingle()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

favorites.post('/:scriptId', async (c) => {
  const user = c.get('user')
  const scriptId = requiredParam(c, 'scriptId')
  const supabase = createSupabaseClient(c)
  const { data, error } = await supabase
    .from('script_favorites')
    .upsert(
      { user_id: user.id, script_id: scriptId },
      { onConflict: 'user_id,script_id' }
    )
    .select('created_at, script:scripts(*)')
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

favorites.delete('/:scriptId', async (c) => {
  const user = c.get('user')
  const scriptId = requiredParam(c, 'scriptId')
  const supabase = createSupabaseClient(c)
  const { error } = await supabase
    .from('script_favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('script_id', scriptId)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

export default favorites
