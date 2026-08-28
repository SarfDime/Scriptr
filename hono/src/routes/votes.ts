import { Hono } from 'hono'
import { requiredParam } from '../lib/request'
import { authMiddleware, createSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const votes = new Hono<HonoEnv>()

/* Get all votes */
votes.get('/', async (c) => {
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase.from('votes').select(`
      *
    `)

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

votes.post('/:id/vote', authMiddleware, async (c) => {
  const user = c.get('user')
  const scriptId = requiredParam(c, 'id')
  const { value } = await c.req.json()

  if (value !== 1 && value !== -1) {
    return c.json({ error: 'Value must be 1 (upvote) or -1 (downvote)' }, 400)
  }

  const supabase = createSupabaseClient(c)

  const { error } = await supabase.from('votes').upsert(
    {
      user_id: user.id,
      script_id: scriptId,
      value,
    },
    {
      onConflict: 'user_id,script_id',
    }
  )

  if (error) {
    return c.json({ error: error.message }, 500)
  }
  return c.json({ success: true })
})

export default votes
