import { Hono } from 'hono'
import { requiredParam } from '../lib/request'
import { authMiddleware, createSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const comments = new Hono<HonoEnv>()

/** Get all comments (public) */
comments.get('/', async (c) => {
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      author:profiles(username, full_name),
      professor:professors(name)
    `)
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

/** Create a new comment */
comments.post('/', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  const { content, professor_id } = await c.req.json()

  if (!content || !professor_id) {
    return c.json({ error: 'Content and professor_id are required' }, 400)
  }

  if (content.trim().length < 3) {
    return c.json({ error: 'Comment must be at least 3 characters long' }, 400)
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      content,
      professor_id,
      author_id: user.id,
    })
    .select(`
      *,
      author:profiles(username, full_name),
      professor:professors(name)
    `)
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, comment: data })
})

/** Update a comment (only by author) */
comments.patch('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const commentId = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)

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
  const supabase = createSupabaseClient(c)

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
