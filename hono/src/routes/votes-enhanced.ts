import { Hono } from 'hono'
import { requiredParam } from '../lib/request'
import { authMiddleware, createSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const votes = new Hono<HonoEnv>()

/** Get all votes */
votes.get('/', async (c) => {
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('votes')
    .select(`
      *,
      user:profiles(username),
      script:scripts(title)
    `)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

/** Get votes for a specific script */
votes.get('/script/:scriptId', async (c) => {
  const scriptId = requiredParam(c, 'scriptId')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('votes')
    .select(`
      *,
      user:profiles(username)
    `)
    .eq('script_id', scriptId)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

/** Get votes by a specific user */
votes.get('/user/:userId', async (c) => {
  const userId = requiredParam(c, 'userId')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('votes')
    .select(`
      *,
      script:scripts(
        id,
        title,
        subject:subjects(name)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

/** Get current user's votes */
votes.get('/my-votes', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('votes')
    .select(`
      *,
      script:scripts(
        id,
        title,
        subject:subjects(name)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

/** Get user's vote for a specific script */
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

/** Vote on a script (upvote or downvote) */
votes.post('/:id/vote', authMiddleware, async (c) => {
  const user = c.get('user')
  const scriptId = requiredParam(c, 'id')
  const { value } = await c.req.json()

  if (value !== 1 && value !== -1) {
    return c.json({ error: 'Value must be 1 (upvote) or -1 (downvote)' }, 400)
  }

  const supabase = createSupabaseClient(c)

  // Check if user has already voted on this script
  const { data: existingVote } = await supabase
    .from('votes')
    .select('*')
    .eq('user_id', user.id)
    .eq('script_id', scriptId)
    .maybeSingle()

  let voteScoreChange = value

  if (existingVote) {
    if (existingVote.value === value) {
      // User is clicking the same vote again - remove the vote
      const { error: deleteError } = await supabase
        .from('votes')
        .delete()
        .eq('user_id', user.id)
        .eq('script_id', scriptId)

      if (deleteError) {
        return c.json({ error: deleteError.message }, 500)
      }

      voteScoreChange = -value // Reverse the vote
    } else {
      // User is changing their vote
      const { error: updateError } = await supabase
        .from('votes')
        .update({ value })
        .eq('user_id', user.id)
        .eq('script_id', scriptId)

      if (updateError) {
        return c.json({ error: updateError.message }, 500)
      }

      voteScoreChange = value * 2 // From -1 to 1 or vice versa (difference is 2)
    }
  } else {
    // New vote
    const { error: insertError } = await supabase.from('votes').insert({
      user_id: user.id,
      script_id: scriptId,
      value,
    })

    if (insertError) {
      return c.json({ error: insertError.message }, 500)
    }
  }

  // Update the script's vote score
  const { data: script } = await supabase
    .from('scripts')
    .select('vote_score')
    .eq('id', scriptId)
    .single()

  if (script) {
    await supabase
      .from('scripts')
      .update({ vote_score: (script.vote_score || 0) + voteScoreChange })
      .eq('id', scriptId)
  }

  return c.json({ success: true })
})

/** Remove vote from a script */
votes.delete('/:scriptId', authMiddleware, async (c) => {
  const user = c.get('user')
  const scriptId = requiredParam(c, 'scriptId')
  const supabase = createSupabaseClient(c)

  // Get the vote to know its value
  const { data: vote } = await supabase
    .from('votes')
    .select('value')
    .eq('user_id', user.id)
    .eq('script_id', scriptId)
    .single()

  if (!vote) {
    return c.json({ error: 'Vote not found' }, 404)
  }

  // Delete the vote
  const { error } = await supabase
    .from('votes')
    .delete()
    .eq('user_id', user.id)
    .eq('script_id', scriptId)

  if (error) return c.json({ error: error.message }, 500)

  // Update the script's vote score
  const { data: script } = await supabase
    .from('scripts')
    .select('vote_score')
    .eq('id', scriptId)
    .single()

  if (script) {
    await supabase
      .from('scripts')
      .update({ vote_score: (script.vote_score || 0) - vote.value })
      .eq('id', scriptId)
  }

  return c.json({ success: true, message: 'Vote removed successfully' })
})

/** Get vote statistics for a script */
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
    upvotes: upvotes || 0,
    downvotes: downvotes || 0,
    total: (upvotes || 0) + (downvotes || 0),
    score: (upvotes || 0) - (downvotes || 0),
  })
})

export default votes
