import { Hono } from 'hono'
import {
  isPortableTextValue,
  portableTextToPlainText,
} from '../../../shared/utils/portable-text.utils'
import { requiredParam } from '../lib/request'
import {
  authMiddleware,
  createInternalSupabaseClient,
  createSupabaseClient,
} from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const comments = new Hono<HonoEnv>()

// Excludes is_flagged, which is internal moderation state and not for public consumption.
const PUBLIC_COMMENT_COLUMNS =
  'id, author_id, content, created_at, edited, parent_id, professor_id, script_id, updated_at'

type CommentEngagementRow = { id: string }

/** Attach reaction/like counts and the current user's own status to comment rows */
async function attachEngagement<T extends CommentEngagementRow>(
  supabase: ReturnType<typeof createSupabaseClient>,
  rows: Array<T>,
  currentUserId?: string
) {
  if (rows.length === 0) return []

  const commentIds = rows.map((row) => row.id)
  const [{ data: reactions }, { data: likes }] = await Promise.all([
    supabase
      .from('comment_reactions')
      .select('comment_id, reaction_type, user_id')
      .in('comment_id', commentIds),
    supabase
      .from('comment_likes')
      .select('comment_id, user_id')
      .in('comment_id', commentIds),
  ])

  return rows.map((row) => {
    const commentReactions =
      reactions?.filter((reaction) => reaction.comment_id === row.id) ?? []
    const commentLikes =
      likes?.filter((like) => like.comment_id === row.id) ?? []
    const reactionsByType: Record<string, number> = {}
    for (const reaction of commentReactions) {
      reactionsByType[reaction.reaction_type] =
        (reactionsByType[reaction.reaction_type] ?? 0) + 1
    }

    return {
      ...row,
      reactions_count: commentReactions.length,
      reactions_by_type: reactionsByType,
      likes_count: commentLikes.length,
      my_reaction:
        (currentUserId &&
          commentReactions.find(
            (reaction) => reaction.user_id === currentUserId
          )?.reaction_type) ||
        null,
      liked_by_me: currentUserId
        ? commentLikes.some((like) => like.user_id === currentUserId)
        : false,
    }
  })
}

/** Get comments for a specific script */
comments.get('/script/:scriptId', async (c) => {
  const scriptId = requiredParam(c, 'scriptId')
  const supabase = createSupabaseClient(c)
  const { data: sessionData } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('comments')
    .select(
      `${PUBLIC_COMMENT_COLUMNS}, author:profiles(username, full_name), professor:professors(name)`
    )
    .eq('script_id', scriptId)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(await attachEngagement(supabase, data, sessionData.user?.id))
})

/** Get comments for a specific professor */
comments.get('/professor/:professorId', async (c) => {
  const professorId = requiredParam(c, 'professorId')
  const supabase = createSupabaseClient(c)
  const { data: sessionData } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('comments')
    .select(`
      ${PUBLIC_COMMENT_COLUMNS},
      author:profiles(username, full_name)
    `)
    .eq('professor_id', professorId)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(await attachEngagement(supabase, data, sessionData.user?.id))
})

/** Get comments by a specific user */
comments.get('/user/:userId', async (c) => {
  const userId = requiredParam(c, 'userId')
  const supabase = createSupabaseClient(c)
  const { data: sessionData } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('comments')
    .select(`
      ${PUBLIC_COMMENT_COLUMNS},
      professor:professors(name)
    `)
    .eq('author_id', userId)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(await attachEngagement(supabase, data, sessionData.user?.id))
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
  const { content, professor_id, script_id } = await c.req.json<{
    content?: unknown
    professor_id?: string
    script_id?: string
  }>()

  if (
    !isPortableTextValue(content) ||
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

  if (portableTextToPlainText(content).length < 3) {
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
      `${PUBLIC_COMMENT_COLUMNS}, author:profiles(username, full_name), professor:professors(name), script:scripts(title)`
    )
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({
    success: true,
    reply: {
      ...data,
      reactions_count: 0,
      reactions_by_type: {},
      likes_count: 0,
      my_reaction: null,
      liked_by_me: false,
    },
  })
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

/** Toggle the current user's like on a comment */
comments.post('/:commentId/like', authMiddleware, async (c) => {
  const user = c.get('user')
  const commentId = requiredParam(c, 'commentId')
  const supabase = createInternalSupabaseClient(c)

  const { data: existingLike } = await supabase
    .from('comment_likes')
    .select('comment_id')
    .eq('comment_id', commentId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingLike) {
    const { error } = await supabase
      .from('comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', user.id)

    if (error) return c.json({ error: error.message }, 500)
    return c.json({ success: true, liked: false })
  }

  const { error } = await supabase
    .from('comment_likes')
    .insert({ comment_id: commentId, user_id: user.id })

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, liked: true })
})

/** Create a new comment */
comments.post('/', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = createInternalSupabaseClient(c)

  const { content, professor_id, script_id } = await c.req.json<{
    content?: unknown
    professor_id?: string
    script_id?: string
  }>()

  if (
    !isPortableTextValue(content) ||
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

  if (portableTextToPlainText(content).length < 3) {
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
      ${PUBLIC_COMMENT_COLUMNS},
      author:profiles(username, full_name),
      professor:professors(name),
      script:scripts(title)
    `)
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({
    success: true,
    comment: {
      ...data,
      reactions_count: 0,
      reactions_by_type: {},
      likes_count: 0,
      my_reaction: null,
      liked_by_me: false,
    },
  })
})

/** Update a comment (only by author) */
comments.patch('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const commentId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)

  const { content } = await c.req.json<{ content?: unknown }>()

  if (
    !isPortableTextValue(content) ||
    portableTextToPlainText(content).length < 3
  ) {
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
      ${PUBLIC_COMMENT_COLUMNS},
      author:profiles(username, full_name),
      professor:professors(name)
    `)
    .single()

  if (error) return c.json({ error: error.message }, 500)
  const [engaged] = await attachEngagement(supabase, [data], user.id)
  return c.json({ success: true, comment: engaged })
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

/** Get flagged comments (moderator only) */
comments.get('/flagged/all', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'moderator') {
    return c.json({ error: 'Unauthorized: Moderator access required' }, 403)
  }

  const { data, error } = await supabase
    .from('comments')
    .select(`
      ${PUBLIC_COMMENT_COLUMNS},
      author:profiles(username, full_name),
      flags:flags(*, reporter:profiles!reporter_id(username))
    `)
    .eq('is_flagged', true)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

export default comments
