import type {
  CommentByProfessor,
  CommentByUser,
  CommentCreateResult,
  CommentFlaggedSummary,
  CommentReactionWithUser,
  CommentSummary,
} from '@shared/types/comments.types'
import type { PortableTextValue } from '@shared/types/portable-text.types'
import { isAdmin } from '@shared/utils/api.utils'
import {
  isPortableTextValue,
  portableTextToPlainText,
} from '@shared/utils/portable-text.utils'
import { Hono } from 'hono'
import { checkCommentsPosted } from '../lib/achievements'
import {
  commentMutationTags,
  revalidateCommentTags,
} from '../lib/cache-revalidate-comments'
import { requiredParam } from '../lib/request'
import { authMiddleware, createSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

// Excludes is_flagged, which is internal moderation state and not for public consumption.
const PUBLIC_COMMENT_COLUMNS =
  'id, author_id, content, created_at, edited, parent_id, professor_id, script_id, updated_at'

/** Reused by `GET /script/:scriptId` and `PATCH /:id` — the two endpoints
 * that select a comment with its author and professor (but no script)
 * joined. Matches `CommentWithAuthorAndProfessor` in
 * `shared/types/comments.types.ts`. */
const COMMENT_WITH_AUTHOR_AND_PROFESSOR_SELECT = `${PUBLIC_COMMENT_COLUMNS}, author:profiles(username, full_name), professor:professors(name)`

/** Reused by `POST /` and `POST /:commentId/replies` — both create a
 * comment and need author, professor, and script joined (exactly one of
 * professor/script is ever populated on a given row; the route doesn't
 * know which ahead of the insert). Matches
 * `CommentWithAuthorProfessorScript`. */
const COMMENT_CREATE_SELECT = `${PUBLIC_COMMENT_COLUMNS}, author:profiles(username, full_name), professor:professors(name), script:scripts(title)`

/** Reused by `GET /:commentId/reactions` and `POST /:commentId/reactions`.
 * Matches `CommentReactionWithUser`. */
const COMMENT_REACTION_WITH_USER_SELECT = '*, user:profiles(username)'

/**
 * `COMMENT_CREATE_SELECT`'s `script:scripts(title)` join carries `title`
 * as raw `Json` for the same reason — narrowed one level deeper, only
 * where that join is actually selected (`POST /` and
 * `POST /:commentId/replies`).
 */
function withVerifiedScriptTitle<
  T extends { script: { title: unknown } | null },
>(row: T) {
  return {
    ...row,
    script: row.script
      ? { title: row.script.title as PortableTextValue }
      : null,
  }
}

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

const comments = new Hono<HonoEnv>()

/** Get comments for a specific script */
comments.get('/script/:scriptId', async (c) => {
  const scriptId = requiredParam(c, 'scriptId')
  const supabase = createSupabaseClient(c)
  const { data: sessionData } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('comments')
    .select(COMMENT_WITH_AUTHOR_AND_PROFESSOR_SELECT)
    .eq('script_id', scriptId)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)

  const engaged = await attachEngagement(supabase, data, sessionData.user?.id)
  return c.json<Array<CommentSummary>>(engaged)
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

  const engaged = await attachEngagement(supabase, data, sessionData.user?.id)
  return c.json<Array<CommentByProfessor>>(engaged)
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

  const engaged = await attachEngagement(supabase, data, sessionData.user?.id)
  return c.json<Array<CommentByUser>>(engaged)
})

/** Get reactions for a comment */
comments.get('/:commentId/reactions', async (c) => {
  const commentId = requiredParam(c, 'commentId')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('comment_reactions')
    .select(COMMENT_REACTION_WITH_USER_SELECT)
    .eq('comment_id', commentId)
    .order('created_at', { ascending: true })

  if (error) return c.json({ error: error.message }, 500)
  // comment_reactions has no Json columns — no narrowing needed.
  return c.json<Array<CommentReactionWithUser>>(data)
})

/** Reply to a comment */
comments.post('/:commentId/replies', authMiddleware, async (c) => {
  const user = c.get('user')
  const commentId = requiredParam(c, 'commentId')
  const supabase = createSupabaseClient(c)
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
    .select(COMMENT_CREATE_SELECT)
    .single()

  // A restricted user's insert fails RLS (is_restricted() check), surfacing here as a
  // generic Postgres error — map it to a clear 403 instead of a raw 500.
  if (error) {
    if (error.code === '42501') {
      return c.json(
        { error: 'Your account is restricted from commenting' },
        403
      )
    }
    return c.json({ error: error.message }, 500)
  }

  await checkCommentsPosted(c, user.id)
  await revalidateCommentTags(c.env, commentMutationTags(data))

  const verified = withVerifiedScriptTitle(data)
  const reply: CommentCreateResult = {
    ...verified,
    reactions_count: 0,
    reactions_by_type: {},
    likes_count: 0,
    my_reaction: null,
    liked_by_me: false,
  }

  return c.json<{ success: true; reply: CommentCreateResult }>({
    success: true,
    reply,
  })
})

/** Add or change the current user's reaction to a comment */
comments.post('/:commentId/reactions', authMiddleware, async (c) => {
  const user = c.get('user')
  const commentId = requiredParam(c, 'commentId')
  const supabase = createSupabaseClient(c)
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
    .select(COMMENT_REACTION_WITH_USER_SELECT)
    .single()

  // Same restriction-check mapping as comment creation — comment_reactions'
  // INSERT/UPDATE RLS both carry is_restricted().
  if (error) {
    if (error.code === '42501') {
      return c.json({ error: 'Your account is restricted from reacting' }, 403)
    }
    return c.json({ error: error.message }, 500)
  }

  // Reactions don't carry script_id/professor_id/author_id themselves —
  // look the parent comment up to know which lists this affects.
  const { data: parentComment } = await supabase
    .from('comments')
    .select('script_id, professor_id, author_id')
    .eq('id', commentId)
    .single()

  if (parentComment) {
    await revalidateCommentTags(c.env, commentMutationTags(parentComment))
  }

  return c.json<{ success: true; reaction: CommentReactionWithUser }>({
    success: true,
    reaction: data,
  })
})

/** Toggle the current user's like on a comment */
comments.post('/:commentId/like', authMiddleware, async (c) => {
  const user = c.get('user')
  const commentId = requiredParam(c, 'commentId')
  const supabase = createSupabaseClient(c)

  const { data: parentComment } = await supabase
    .from('comments')
    .select('script_id, professor_id, author_id')
    .eq('id', commentId)
    .single()

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
    if (parentComment) {
      await revalidateCommentTags(c.env, commentMutationTags(parentComment))
    }
    return c.json({ success: true, liked: false })
  }

  const { error } = await supabase
    .from('comment_likes')
    .insert({ comment_id: commentId, user_id: user.id })

  if (error) {
    if (error.code === '42501') {
      return c.json(
        { error: 'Your account is restricted from liking comments' },
        403
      )
    }
    return c.json({ error: error.message }, 500)
  }
  if (parentComment) {
    await revalidateCommentTags(c.env, commentMutationTags(parentComment))
  }
  return c.json({ success: true, liked: true })
})

/** Create a new comment */
comments.post('/', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

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
    .select(COMMENT_CREATE_SELECT)
    .single()

  // A restricted user's insert fails RLS (is_restricted() check), surfacing here as a
  // generic Postgres error — map it to a clear 403 instead of a raw 500.
  if (error) {
    if (error.code === '42501') {
      return c.json(
        { error: 'Your account is restricted from commenting' },
        403
      )
    }
    return c.json({ error: error.message }, 500)
  }

  await checkCommentsPosted(c, user.id)
  await revalidateCommentTags(c.env, commentMutationTags(data))

  const verified = withVerifiedScriptTitle(data)
  const comment: CommentCreateResult = {
    ...verified,
    reactions_count: 0,
    reactions_by_type: {},
    likes_count: 0,
    my_reaction: null,
    liked_by_me: false,
  }

  return c.json<{ success: true; comment: CommentCreateResult }>({
    success: true,
    comment,
  })
})

/** Update a comment (author or admin) */
comments.patch('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const commentId = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)

  const { content } = await c.req.json<{ content?: unknown }>()

  if (
    !isPortableTextValue(content) ||
    portableTextToPlainText(content).length < 3
  ) {
    return c.json({ error: 'Comment must be at least 3 characters long' }, 400)
  }

  // Check if user is the author or an admin (RLS's UPDATE policy already
  // allows either — this mirrors that instead of only checking authorship).
  const [{ data: profile }, { data: existingComment }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase.from('comments').select('author_id').eq('id', commentId).single(),
  ])

  if (existingComment?.author_id !== user.id && !isAdmin(profile?.role)) {
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
    .select(COMMENT_WITH_AUTHOR_AND_PROFESSOR_SELECT)
    .single()

  if (error) return c.json({ error: error.message }, 500)

  await revalidateCommentTags(c.env, commentMutationTags(data))
  const [engaged] = await attachEngagement(supabase, [data], user.id)

  return c.json<{ success: true; comment?: CommentSummary }>({
    success: true,
    comment: engaged,
  })
})

/** Delete a comment (by author or admin) */
comments.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const commentId = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)

  // Get user's role and comment author/target (target needed for cache
  // revalidation after delete, since the row won't exist to look up then)
  const [{ data: profile }, { data: comment }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase
      .from('comments')
      .select('author_id, script_id, professor_id')
      .eq('id', commentId)
      .single(),
  ])

  // Check if user is author or admin
  if (comment?.author_id !== user.id && !isAdmin(profile?.role)) {
    return c.json(
      {
        error: 'Unauthorized: You can only delete your own comments',
      },
      403
    )
  }

  const { error } = await supabase.from('comments').delete().eq('id', commentId)

  if (error) return c.json({ error: error.message }, 500)
  if (comment) {
    await revalidateCommentTags(c.env, commentMutationTags(comment))
  }
  return c.json({ success: true, message: 'Comment deleted successfully' })
})

/** Get flagged comments (admin only) */
comments.get('/flagged/all', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAdmin(profile?.role)) {
    return c.json({ error: 'Unauthorized: Admin access required' }, 403)
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
  return c.json<Array<CommentFlaggedSummary>>(data)
})

export default comments
