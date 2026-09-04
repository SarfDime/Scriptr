import { Hono } from 'hono'
import { requiredParam } from '../lib/request'
import {
  authMiddleware,
  createInternalSupabaseClient,
  createSupabaseClient,
} from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const votes = new Hono<HonoEnv>()

votes.get('/', async (c) => {
  const supabase = createSupabaseClient(c)
  const { data, error } = await supabase
    .from('votes')
    .select('*, user:profiles(username), script:scripts(title)')
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

votes.get('/script/:scriptId', async (c) => {
  const scriptId = requiredParam(c, 'scriptId')
  const supabase = createSupabaseClient(c)
  const { data, error } = await supabase
    .from('votes')
    .select('*, user:profiles(username)')
    .eq('script_id', scriptId)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

votes.get('/user/:userId', async (c) => {
  const userId = requiredParam(c, 'userId')
  const supabase = createSupabaseClient(c)
  const { data, error } = await supabase
    .from('votes')
    .select('*, script:scripts(id, title, subject:subjects(name))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

votes.get('/my-votes', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)
  const { data, error } = await supabase
    .from('votes')
    .select('*, script:scripts(id, title, subject:subjects(name))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

votes.get('/script/:scriptId/my-vote', authMiddleware, async (c) => {
  const user = c.get('user')
  const scriptId = requiredParam(c, 'scriptId')
  const supabase = createSupabaseClient(c)
  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .eq('user_id', user.id)
    .eq('script_id', scriptId)
    .maybeSingle()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

votes.get('/script/:scriptId/stats', async (c) => {
  const scriptId = requiredParam(c, 'scriptId')
  const supabase = createSupabaseClient(c)
  const [{ count: upvotes }, { count: downvotes }] = await Promise.all([
    supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('script_id', scriptId)
      .eq('value', 1),
    supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('script_id', scriptId)
      .eq('value', -1),
  ])

  return c.json({
    upvotes: upvotes ?? 0,
    downvotes: downvotes ?? 0,
    total: (upvotes ?? 0) + (downvotes ?? 0),
    score: Math.max(0, upvotes ?? 0),
  })
})

/** Toggle the current user's +1 vote for a script. */
votes.post('/:scriptId', authMiddleware, async (c) => {
  const user = c.get('user')
  const scriptId = requiredParam(c, 'scriptId')
  const supabase = createInternalSupabaseClient(c)

  const { data: script, error: scriptError } = await supabase
    .from('scripts')
    .select('vote_score')
    .eq('id', scriptId)
    .single()

  if (scriptError || !script) {
    return c.json({ error: 'Script not found' }, 404)
  }

  const { data: existingVote, error: voteLookupError } = await supabase
    .from('votes')
    .select('id')
    .eq('user_id', user.id)
    .eq('script_id', scriptId)
    .maybeSingle()

  if (voteLookupError) {
    return c.json({ error: voteLookupError.message }, 500)
  }

  if (existingVote) {
    const { error: deleteError } = await supabase
      .from('votes')
      .delete()
      .eq('id', existingVote.id)

    if (deleteError) {
      return c.json({ error: deleteError.message }, 500)
    }

    const nextScore = Math.max(0, script.vote_score - 1)
    const { error: scoreError } = await supabase
      .from('scripts')
      .update({ vote_score: nextScore })
      .eq('id', scriptId)

    if (scoreError) {
      return c.json({ error: scoreError.message }, 500)
    }

    return c.json({ voted: false, vote_score: nextScore })
  }

  const { error: insertError } = await supabase.from('votes').insert({
    user_id: user.id,
    script_id: scriptId,
    value: 1,
  })

  if (insertError) {
    return c.json({ error: insertError.message }, 500)
  }

  const nextScore = Math.max(0, script.vote_score + 1)
  const { error: scoreError } = await supabase
    .from('scripts')
    .update({ vote_score: nextScore })
    .eq('id', scriptId)

  if (scoreError) {
    return c.json({ error: scoreError.message }, 500)
  }

  return c.json({ voted: true, vote_score: nextScore })
})

export default votes
