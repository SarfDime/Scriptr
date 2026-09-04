import { Hono } from 'hono'
import { requiredParam } from '../lib/request'
import {
  authMiddleware,
  createInternalSupabaseClient,
  createSupabaseClient,
} from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const comments = new Hono<HonoEnv>()

/** Get all comments */
comments.get('/', async (c) => {
  const supabase = createSupabaseClient(c)
  const { data, error } = await supabase
    .from('comments')
    .select(
      '*, author:profiles(username, full_name), professor:professors(name), script:scripts(title)'
    )
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

/** Get comments for a specific script */
comments.get('/script/:scriptId', async (c) => {
  const scriptId = requiredParam(c, 'scriptId')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('comments')
    .select(
      '*, author:profiles(username, full_name), professor:professors(name)'
    )
    .eq('script_id', scriptId)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

/** Get comments for a specific professor */
comments.get('/professor/:professorId', async (c) => {
  const professorId = requiredParam(c, 'professorId')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      author:profiles(username, full_name)
    `)
    .eq('professor_id', professorId)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

/** Get comments by a specific user */
comments.get('/user/:userId', async (c) => {
  const userId = requiredParam(c, 'userId')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      professor:professors(name)
    `)
    .eq('author_id', userId)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

/** Get reactions for a comment */
comments.get('/:commentId/reactions', async (c) => {
  const commentId = requiredParam(c, 'commentId')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('comment_reactions')
    .select('*, user:profiles(username)')
    .eq('comment_id', commentId)
    .order('created_at', { ascending: true })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

/** Reply to a comment */
comments.post('/:commentId/replies', authMiddleware, async (c) => {
  const user = c.get('user')
  const commentId = requiredParam(c, 'commentId')
  const supabase = createInternalSupabaseClient(c)
  const { content, professor_id, script_id } = await c.req.json()

  if (
    !content ||
    (professor_id && script_id) ||
    (!professor_id && !script_id)
  ) {
    return c.json(
      {
        error:
          'Content and exactly one of professor_id or script_id are required',
      },
      400
    )
  }

  if (content.trim().length < 3) {
    return c.json({ error: 'Reply must be at least 3 characters long' }, 400)
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      author_id: user.id,
      content,
      parent_id: commentId,
      professor_id: professor_id ?? null,
      script_id: script_id ?? null,
    })
    .select(
      '*, author:profiles(username, full_name), professor:professors(name), script:scripts(title)'
    )
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, reply: data })
})

/** Add or change the current user's reaction to a comment */
comments.post('/:commentId/reactions', authMiddleware, async (c) => {
  const user = c.get('user')
  const commentId = requiredParam(c, 'commentId')
  const supabase = createInternalSupabaseClient(c)
  const { reaction_type } = await c.req.json()

  if (!reaction_type || typeof reaction_type !== 'string') {
    return c.json({ error: 'reaction_type is required' }, 400)
  }

  const { data, error } = await supabase
    .from('comment_reactions')
    .upsert(
      {
        comment_id: commentId,
        reaction_type: reaction_type.trim(),
        user_id: user.id,
      },
      { onConflict: 'comment_id,user_id' }
    )
    .select('*, user:profiles(username)')
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, reaction: data })
})

/** Create a new comment */
comments.post('/', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = createInternalSupabaseClient(c)

  const { content, professor_id, script_id } = await c.req.json()

  if (
    !content ||
    (professor_id && script_id) ||
    (!professor_id && !script_id)
  ) {
    return c.json(
      {
        error:
          'Content and exactly one of professor_id or script_id are required',
      },
      400
    )
  }

  if (content.trim().length < 3) {
    return c.json({ error: 'Comment must be at least 3 characters long' }, 400)
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      content,
      professor_id: professor_id ?? null,
      script_id: script_id ?? null,
      author_id: user.id,
    })
    .select(`
      *,
      author:profiles(username, full_name),
      professor:professors(name),
      script:scripts(title)
    `)
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, comment: data })
})

/** Update a comment (only by author) */
comments.patch('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const commentId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)

  const { content } = await c.req.json()

  if (!content || content.trim().length < 3) {
    return c.json({ error: 'Comment must be at least 3 characters long' }, 400)
  }

  // Check if user is the author
  const { data: existingComment } = await supabase
    .from('comments')
    .select('author_id')
    .eq('id', commentId)
    .single()

  if (existingComment?.author_id !== user.id) {
    return c.json(
      { error: 'Unauthorized: You can only edit your own comments' },
      403
    )
  }

  const { data, error } = await supabase
    .from('comments')
    .update({
      content,
      edited: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .select(`
      *,
      author:profiles(username, full_name),
      professor:professors(name)
    `)
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, comment: data })
})

/** Delete a comment (by author or moderator) */
comments.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const commentId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)

  // Get user's role and comment author
  const [{ data: profile }, { data: comment }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase.from('comments').select('author_id').eq('id', commentId).single(),
  ])

  // Check if user is author or moderator
  if (comment?.author_id !== user.id && profile?.role !== 'moderator') {
    return c.json(
      { error: 'Unauthorized: You can only delete your own comments' },
      403
    )
  }

  const { error } = await supabase.from('comments').delete().eq('id', commentId)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, message: 'Comment deleted successfully' })
})

export default comments
