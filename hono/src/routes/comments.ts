import { commentMutationTags } from '@shared/config/comment-cache-revalidate'
import { PORTABLE_TEXT_LIMITS } from '@shared/config/portable-text-limits'
import {
  COMMENT_REPLIES_PAGE_SIZE,
  COMMENT_REPLIES_PREVIEW_SIZE,
  COMMENT_SORT_OPTIONS,
  COMMENTS_PAGE_SIZE,
  type CommentSort,
  isReactionType,
} from '@shared/config/shared-constants'
import { COMMENT_STRINGS } from '@shared/strings/comments-strings'
import { NOTIFICATION_ROW_STRINGS } from '@shared/strings/notifications-strings'
import type {
  CommentCreateResult,
  CommentFlaggedSummary,
  CommentPage,
  CommentReactionToggleResponse,
  CommentReactionWithUser,
  CommentReplySummary,
  CommentSummary,
  CommentWithAuthorAndProfessor,
  CommentWithReplyPreview,
  ReactionType,
} from '@shared/types/comments.types'
import type { PortableTextValue } from '@shared/types/portable-text.types'
import { isOwner } from '@shared/utils/api.utils'
import {
  isCommentPortableTextValue,
  portableTextJsonByteLength,
  portableTextToPlainText,
} from '@shared/utils/portable-text.utils'
import { Hono } from 'hono'
import { createRateLimiter } from '../../../shared/utils/rate-limit'
import { checkCommentsPosted } from '../lib/achievements'
import { requireAdminAccess } from '../lib/admin-access'
import { revalidateCacheTags } from '../lib/cache-revalidate'
import { honoLog } from '../lib/logger'
import { notifyProfileBestEffort } from '../lib/notifications'
import { requiredParam } from '../lib/request'
import { requireStudyRole, studyIdForScript } from '../lib/require-admin'
import { canWriteInStudy, STUDY_WRITE_DENIED_BODY } from '../lib/study-access'
import {
  authMiddleware,
  createInternalSupabaseClient,
  createSupabaseClient,
} from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

// Excludes is_flagged, which is internal moderation state and not for public consumption.
const PUBLIC_COMMENT_COLUMNS =
  'id, author_id, content, created_at, edited, parent_id, professor_id, script_id, updated_at'

/** Reused by `GET /script/:scriptId` and `PATCH /:id` — the two endpoints
 * that select a comment with its author and professor (but no script)
 * joined. Matches `CommentWithAuthorAndProfessor` in
 * `shared/types/comments.types.ts`. */
const COMMENT_WITH_AUTHOR_AND_PROFESSOR_SELECT = `${PUBLIC_COMMENT_COLUMNS}, author:profiles!author_id(username, full_name, avatar_url), professor:professors(name)`

/** Reused by `POST /` and `POST /:commentId/replies` — both create a
 * comment and need author, professor, and script joined (exactly one of
 * professor/script is ever populated on a given row; the route doesn't
 * know which ahead of the insert). Matches
 * `CommentWithAuthorProfessorScript`. */
const COMMENT_CREATE_SELECT = `${PUBLIC_COMMENT_COLUMNS}, author:profiles!author_id(username, full_name, avatar_url), professor:professors(name), script:scripts(title)`

/** Reused by `GET /:commentId/reactions` and `POST /:commentId/reactions`.
 * Matches `CommentReactionWithUser`. */
const COMMENT_REACTION_WITH_USER_SELECT = '*, user:profiles(username)'
const ENGAGEMENT_PAGE_SIZE = 1000
const COMMENT_POST_WINDOW_MS = 15 * 60 * 1000
const COMMENT_POST_LIMIT = 10
const COMMENT_ENGAGEMENT_WINDOW_MS = 60 * 1000
const COMMENT_ENGAGEMENT_LIMIT = 15

const isCommentPostLimited = createRateLimiter({
  limit: COMMENT_POST_LIMIT,
  windowMs: COMMENT_POST_WINDOW_MS,
})
const isEngagementLimited = createRateLimiter({
  limit: COMMENT_ENGAGEMENT_LIMIT,
  windowMs: COMMENT_ENGAGEMENT_WINDOW_MS,
})
/** One study's write path is also limited as a whole, so a crowd cannot flood
 * a study's comments while every individual stays under their own limit. */
const STUDY_COMMENT_POST_LIMIT = 60
const isStudyCommentLimited = createRateLimiter({
  limit: STUDY_COMMENT_POST_LIMIT,
  windowMs: COMMENT_POST_WINDOW_MS,
})

function parsePage(
  c: Parameters<typeof createSupabaseClient>[0],
  maximumLimit = COMMENTS_PAGE_SIZE
) {
  const limit = Number(c.req.query('limit') ?? maximumLimit)
  const offset = Number(c.req.query('offset') ?? 0)
  if (
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > maximumLimit ||
    !Number.isSafeInteger(offset) ||
    offset < 0
  ) {
    return null
  }
  return { limit, offset }
}

function parseCommentSort(
  c: Parameters<typeof createSupabaseClient>[0]
): CommentSort | null {
  const sort = c.req.query('sort') ?? 'newest'
  return COMMENT_SORT_OPTIONS.includes(sort as CommentSort)
    ? (sort as CommentSort)
    : null
}

function databaseErrorResponse(
  c: Parameters<typeof createSupabaseClient>[0],
  error: { code?: string; message: string },
  operation: string
) {
  honoLog({ logLevel: 'error', message: operation, error })
  switch (error.code) {
    case '23505':
      return c.json({ error: 'This action conflicts with existing data' }, 409)
    case '23503':
      return c.json(
        { error: 'This comment is still referenced by other content' },
        409
      )
    case '42501':
      return c.json(
        { error: 'You are not permitted to perform this action' },
        403
      )
    case 'P0001':
      return c.json({ error: error.message }, 400)
    case '23514':
      return c.json(
        { error: 'The comment does not match its parent target' },
        400
      )
    default:
      return c.json({ error: 'Unable to complete the comment request' }, 500)
  }
}

/** Commenting is limited per caller and, on a study's content, per study — the
 * second key lets the limit follow the tenant the write lands in. */
function isCommentRateLimited(
  userId: string,
  action: 'comment' | 'reply',
  studyId: string | null
) {
  return (
    isCommentPostLimited(`${action}:${userId}`) ||
    (studyId !== null && isStudyCommentLimited(studyId))
  )
}

function isEngagementRateLimited(userId: string) {
  return isEngagementLimited(userId)
}

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

type EngagementPage<T> = {
  data: Array<T> | null
  error: { code?: string; message: string } | null
  count: number | null
}

async function fetchAllEngagementRows<T>(
  fetchPage: (
    offset: number,
    pageSize: number
  ) => PromiseLike<EngagementPage<T>>
) {
  const rows: Array<T> = []
  let offset = 0
  let pageSize = ENGAGEMENT_PAGE_SIZE

  while (true) {
    const { data, error, count } = await fetchPage(offset, pageSize)
    if (error) return { data: null, error }
    if (data === null || count === null) {
      return {
        data: null,
        error: { message: 'Engagement query did not return a total count' },
      }
    }
    if (data.length === 0 && offset < count) {
      return {
        data: null,
        error: { message: 'Engagement query returned an incomplete page' },
      }
    }

    if (data.length < pageSize && offset + data.length < count) {
      pageSize = data.length
      continue
    }

    rows.push(...data)
    offset += data.length
    if (offset >= count) return { data: rows, error: null }
  }
}

function getCurrentUserReactionTypes(
  reactions: Array<{ reaction_type: string; user_id: string }>,
  currentUserId: string | undefined
): Array<ReactionType> {
  if (!currentUserId) return []

  const reactionTypes: Array<ReactionType> = []
  for (const reaction of reactions) {
    if (
      reaction.user_id === currentUserId &&
      isReactionType(reaction.reaction_type)
    ) {
      reactionTypes.push(reaction.reaction_type)
    }
  }
  return reactionTypes
}

/** Attach reaction/like counts and the current user's own status to comment rows */
async function attachEngagement<T extends CommentEngagementRow>(
  c: Parameters<typeof createSupabaseClient>[0],
  rows: Array<T>,
  currentUserId?: string
) {
  if (rows.length === 0) return { data: [], error: null }

  const commentIds = rows.map((row) => row.id)
  // RLS may only expose a viewer's own engagement rows. Read all rows
  // server-side so public counts are complete, but only return aggregates
  // and the requesting user's own reaction/like state.
  const supabase = createInternalSupabaseClient(c)
  const reactionResult = await fetchAllEngagementRows<{
    comment_id: string
    reaction_type: string
    user_id: string
  }>((offset, pageSize) =>
    supabase
      .from('comment_reactions')
      .select('comment_id, reaction_type, user_id', { count: 'exact' })
      .in('comment_id', commentIds)
      .order('comment_id', { ascending: true })
      .order('reaction_type', { ascending: true })
      .order('user_id', { ascending: true })
      .range(offset, offset + pageSize - 1)
  )
  if (reactionResult.error) return reactionResult

  const likeResult = await fetchAllEngagementRows<{
    comment_id: string
    user_id: string
  }>((offset, pageSize) =>
    supabase
      .from('comment_likes')
      .select('comment_id, user_id', { count: 'exact' })
      .in('comment_id', commentIds)
      .order('comment_id', { ascending: true })
      .order('user_id', { ascending: true })
      .range(offset, offset + pageSize - 1)
  )
  if (likeResult.error) return likeResult

  const reactions = reactionResult.data
  const likes = likeResult.data

  const reactionsByComment = new Map<
    string,
    Array<{ reaction_type: string; user_id: string }>
  >()
  for (const reaction of reactions) {
    const commentReactions = reactionsByComment.get(reaction.comment_id) ?? []
    commentReactions.push(reaction)
    reactionsByComment.set(reaction.comment_id, commentReactions)
  }
  const likesByComment = new Map<string, Array<{ user_id: string }>>()
  for (const like of likes) {
    const commentLikes = likesByComment.get(like.comment_id) ?? []
    commentLikes.push(like)
    likesByComment.set(like.comment_id, commentLikes)
  }

  return {
    data: rows.map((row) => {
      const commentReactions = reactionsByComment.get(row.id) ?? []
      const commentLikes = likesByComment.get(row.id) ?? []
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
        my_reactions: getCurrentUserReactionTypes(
          commentReactions,
          currentUserId
        ),
        liked_by_me: currentUserId
          ? commentLikes.some((like) => like.user_id === currentUserId)
          : false,
      }
    }),
    error: null,
  }
}

async function fetchReplyPreviews(
  supabase: ReturnType<typeof createSupabaseClient>,
  rows: Array<CommentWithAuthorAndProfessor>
) {
  const repliesByRoot = await Promise.all(
    rows.map(async (root) => {
      const result = await supabase
        .from('comments')
        .select(COMMENT_WITH_AUTHOR_AND_PROFESSOR_SELECT, { count: 'exact' })
        .eq('parent_id', root.id)
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
        .range(0, COMMENT_REPLIES_PREVIEW_SIZE - 1)
      return { rootId: root.id, ...result }
    })
  )

  const failed = repliesByRoot.find((result) => result.error)
  if (failed?.error) return { data: null, error: failed.error }

  const previewReplies = repliesByRoot.flatMap((result) => result.data ?? [])
  const previewRepliesWithChildren =
    previewReplies.length === 0
      ? { data: [], error: null }
      : await supabase
          .from('comments')
          .select('parent_id')
          .in(
            'parent_id',
            previewReplies.map((reply) => reply.id)
          )
  if (previewRepliesWithChildren.error) {
    return { data: null, error: previewRepliesWithChildren.error }
  }
  const parentsWithReplies = new Set(
    previewRepliesWithChildren.data.map((row) => row.parent_id)
  )
  const replyRowsById = new Map(
    previewReplies.map((reply) => [
      reply.id,
      { ...reply, has_replies: parentsWithReplies.has(reply.id) },
    ])
  )

  const repliesByRootId = new Map(
    repliesByRoot.map((result) => [
      result.rootId,
      {
        replies: (result.data ?? []).map(
          (reply) =>
            replyRowsById.get(reply.id) ?? { ...reply, has_replies: false }
        ),
        hasMore: (result.count ?? 0) > (result.data?.length ?? 0),
      },
    ])
  )

  return {
    data: rows.map((root) => {
      const preview = repliesByRootId.get(root.id)
      return {
        ...root,
        replies: preview?.replies ?? [],
        replies_has_more: preview?.hasMore ?? false,
      }
    }),
    error: null,
  }
}

async function attachReplyPreviewEngagement(
  c: Parameters<typeof createSupabaseClient>[0],
  supabase: ReturnType<typeof createSupabaseClient>,
  rows: Array<CommentWithAuthorAndProfessor>,
  currentUserId?: string
) {
  const previewResult = await fetchReplyPreviews(supabase, rows)
  if (previewResult.error) return previewResult
  const withPreviews = previewResult.data
  const replyRows = withPreviews.flatMap(({ replies }) => replies)
  const engagement = await attachEngagement(
    c,
    [...rows, ...replyRows],
    currentUserId
  )
  if (engagement.error) return engagement

  const rowsById = new Map<string, CommentSummary>(
    engagement.data.map((row) => [row.id, row])
  )
  const data: Array<CommentWithReplyPreview> = withPreviews.map((root) => {
    const engagedRoot = rowsById.get(root.id)
    if (!engagedRoot) {
      throw new Error(`Missing engagement for comment ${root.id}`)
    }

    const previewReplies: Array<CommentReplySummary> = root.replies.map(
      (reply) => {
        const engagedReply = rowsById.get(reply.id)
        if (!engagedReply) {
          throw new Error(`Missing engagement for reply ${reply.id}`)
        }
        const replySummary: CommentReplySummary = {
          ...engagedReply,
          has_replies: reply.has_replies,
        }
        return replySummary
      }
    )

    return {
      ...engagedRoot,
      replies: previewReplies,
      replies_has_more: root.replies_has_more,
    }
  })

  return { data, error: null as null }
}

async function countTargetComments(
  supabase: ReturnType<typeof createSupabaseClient>,
  targetColumn: 'script_id' | 'professor_id' | 'author_id',
  targetId: string
) {
  return supabase
    .from('comments')
    .select('id', { count: 'exact', head: true })
    .eq(targetColumn, targetId)
}

function orderRowsByIds<T extends { id: string }>(
  rows: Array<T>,
  orderedIds: Array<string>
): Array<T> {
  const rowsById = new Map(rows.map((row) => [row.id, row]))
  return orderedIds.flatMap((id) => {
    const row = rowsById.get(id)
    return row ? [row] : []
  })
}

const comments = new Hono<HonoEnv>()

/** Get comments for a specific script */
comments.get('/script/:scriptId', async (c) => {
  const scriptId = requiredParam(c, 'scriptId')
  const page = parsePage(c)
  const sort = parseCommentSort(c)
  if (!page || !sort) {
    return c.json({ error: 'Invalid pagination or sort parameters' }, 400)
  }
  const supabase = createSupabaseClient(c)
  const { data: sessionData } = await supabase.auth.getUser()

  let rootCount = 0
  let orderedIds: Array<string> = []
  if (sort === 'top') {
    const [{ count, error: countError }, { data: ids, error: topError }] =
      await Promise.all([
        supabase
          .from('comments')
          .select('id', { count: 'exact', head: true })
          .eq('script_id', scriptId)
          .is('parent_id', null),
        supabase.rpc('get_top_comment_ids', {
          p_script_id: scriptId,
          p_professor_id: null,
          p_author_id: null,
          p_limit: page.limit,
          p_offset: page.offset,
        }),
      ])
    if (countError) {
      return databaseErrorResponse(
        c,
        countError,
        'Failed to count script comments'
      )
    }
    if (topError) {
      return databaseErrorResponse(
        c,
        topError,
        'Failed to rank script comments'
      )
    }
    rootCount = count ?? 0
    orderedIds = ids.map(({ comment_id }) => comment_id)
  }

  let data: Array<CommentWithAuthorAndProfessor> = []
  let error: { code?: string; message: string } | null = null
  if (sort === 'top') {
    if (orderedIds.length === 0) {
      data = []
      error = null
    } else {
      const result = await supabase
        .from('comments')
        .select(COMMENT_WITH_AUTHOR_AND_PROFESSOR_SELECT)
        .in('id', orderedIds)
      data = orderRowsByIds(result.data ?? [], orderedIds)
      error = result.error
    }
  } else {
    const result = await supabase
      .from('comments')
      .select(COMMENT_WITH_AUTHOR_AND_PROFESSOR_SELECT, { count: 'exact' })
      .eq('script_id', scriptId)
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(page.offset, page.offset + page.limit - 1)
    data = result.data ?? []
    error = result.error
    rootCount = result.count ?? 0
  }

  if (error)
    return databaseErrorResponse(c, error, 'Failed to fetch script comments')

  const engaged = await attachReplyPreviewEngagement(
    c,
    supabase,
    data,
    sessionData.user?.id
  )
  if (engaged.error) {
    return databaseErrorResponse(
      c,
      engaged.error,
      'Failed to fetch comment engagement'
    )
  }
  const allComments = await countTargetComments(supabase, 'script_id', scriptId)
  if (allComments.error) {
    return databaseErrorResponse(
      c,
      allComments.error,
      'Failed to count script comments'
    )
  }
  return c.json<CommentPage<CommentWithReplyPreview>>({
    items: engaged.data,
    hasMore: page.offset + engaged.data.length < rootCount,
    totalCount: rootCount,
    totalCommentCount: allComments.count ?? 0,
  })
})

/** Get comments for a specific professor */
comments.get('/professor/:professorId', async (c) => {
  const professorId = requiredParam(c, 'professorId')
  const page = parsePage(c)
  const sort = parseCommentSort(c)
  if (!page || !sort) {
    return c.json({ error: 'Invalid pagination or sort parameters' }, 400)
  }
  const supabase = createSupabaseClient(c)
  const { data: sessionData } = await supabase.auth.getUser()

  let rootCount = 0
  let orderedIds: Array<string> = []
  if (sort === 'top') {
    const [{ count, error: countError }, { data: ids, error: topError }] =
      await Promise.all([
        supabase
          .from('comments')
          .select('id', { count: 'exact', head: true })
          .eq('professor_id', professorId)
          .is('parent_id', null),
        supabase.rpc('get_top_comment_ids', {
          p_script_id: null,
          p_professor_id: professorId,
          p_author_id: null,
          p_limit: page.limit,
          p_offset: page.offset,
        }),
      ])
    if (countError) {
      return databaseErrorResponse(
        c,
        countError,
        'Failed to count professor comments'
      )
    }
    if (topError) {
      return databaseErrorResponse(
        c,
        topError,
        'Failed to rank professor comments'
      )
    }
    rootCount = count ?? 0
    orderedIds = ids.map(({ comment_id }) => comment_id)
  }

  let data: Array<CommentWithAuthorAndProfessor> = []
  let error: { code?: string; message: string } | null = null
  if (sort === 'top') {
    if (orderedIds.length === 0) {
      data = []
      error = null
    } else {
      const result = await supabase
        .from('comments')
        .select(COMMENT_WITH_AUTHOR_AND_PROFESSOR_SELECT)
        .in('id', orderedIds)
      data = orderRowsByIds(result.data ?? [], orderedIds)
      error = result.error
    }
  } else {
    const result = await supabase
      .from('comments')
      .select(COMMENT_WITH_AUTHOR_AND_PROFESSOR_SELECT, { count: 'exact' })
      .eq('professor_id', professorId)
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(page.offset, page.offset + page.limit - 1)
    data = result.data ?? []
    error = result.error
    rootCount = result.count ?? 0
  }

  if (error)
    return databaseErrorResponse(c, error, 'Failed to fetch professor comments')

  const engaged = await attachReplyPreviewEngagement(
    c,
    supabase,
    data,
    sessionData.user?.id
  )
  if (engaged.error) {
    return databaseErrorResponse(
      c,
      engaged.error,
      'Failed to fetch comment engagement'
    )
  }
  const allComments = await countTargetComments(
    supabase,
    'professor_id',
    professorId
  )
  if (allComments.error) {
    return databaseErrorResponse(
      c,
      allComments.error,
      'Failed to count professor comments'
    )
  }
  return c.json<CommentPage<CommentWithReplyPreview>>({
    items: engaged.data,
    hasMore: page.offset + engaged.data.length < rootCount,
    totalCount: rootCount,
    totalCommentCount: allComments.count ?? 0,
  })
})

/** Get comments by a specific user */
comments.get('/user/:userId', async (c) => {
  const userId = requiredParam(c, 'userId')
  const page = parsePage(c)
  const sort = parseCommentSort(c)
  if (!page || !sort) {
    return c.json({ error: 'Invalid pagination or sort parameters' }, 400)
  }
  const supabase = createSupabaseClient(c)
  const { data: sessionData } = await supabase.auth.getUser()

  let rootCount = 0
  let orderedIds: Array<string> = []
  if (sort === 'top') {
    const [{ count, error: countError }, { data: ids, error: topError }] =
      await Promise.all([
        supabase
          .from('comments')
          .select('id', { count: 'exact', head: true })
          .eq('author_id', userId)
          .is('parent_id', null),
        supabase.rpc('get_top_comment_ids', {
          p_script_id: null,
          p_professor_id: null,
          p_author_id: userId,
          p_limit: page.limit,
          p_offset: page.offset,
        }),
      ])
    if (countError) {
      return databaseErrorResponse(
        c,
        countError,
        'Failed to count user comments'
      )
    }
    if (topError) {
      return databaseErrorResponse(c, topError, 'Failed to rank user comments')
    }
    rootCount = count ?? 0
    orderedIds = ids.map(({ comment_id }) => comment_id)
  }

  let data: Array<CommentWithAuthorAndProfessor> = []
  let error: { code?: string; message: string } | null = null
  if (sort === 'top') {
    if (orderedIds.length === 0) {
      data = []
      error = null
    } else {
      const result = await supabase
        .from('comments')
        .select(COMMENT_WITH_AUTHOR_AND_PROFESSOR_SELECT)
        .in('id', orderedIds)
      data = orderRowsByIds(result.data ?? [], orderedIds)
      error = result.error
    }
  } else {
    const result = await supabase
      .from('comments')
      .select(COMMENT_WITH_AUTHOR_AND_PROFESSOR_SELECT, { count: 'exact' })
      .eq('author_id', userId)
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(page.offset, page.offset + page.limit - 1)
    data = result.data ?? []
    error = result.error
    rootCount = result.count ?? 0
  }

  if (error)
    return databaseErrorResponse(c, error, 'Failed to fetch user comments')

  const engaged = await attachReplyPreviewEngagement(
    c,
    supabase,
    data,
    sessionData.user?.id
  )
  if (engaged.error) {
    return databaseErrorResponse(
      c,
      engaged.error,
      'Failed to fetch comment engagement'
    )
  }
  const allComments = await countTargetComments(supabase, 'author_id', userId)
  if (allComments.error) {
    return databaseErrorResponse(
      c,
      allComments.error,
      'Failed to count user comments'
    )
  }
  return c.json<CommentPage<CommentWithReplyPreview>>({
    items: engaged.data,
    hasMore: page.offset + engaged.data.length < rootCount,
    totalCount: rootCount,
    totalCommentCount: allComments.count ?? 0,
  })
})

/** Get one bounded page of immediate replies for a comment. */
comments.get('/:commentId/replies', async (c) => {
  const commentId = requiredParam(c, 'commentId')
  const page = parsePage(c, COMMENT_REPLIES_PAGE_SIZE)
  if (!page) return c.json({ error: 'Invalid pagination parameters' }, 400)
  const supabase = createSupabaseClient(c)
  const { data: sessionData } = await supabase.auth.getUser()

  const { data, error, count } = await supabase
    .from('comments')
    .select(COMMENT_WITH_AUTHOR_AND_PROFESSOR_SELECT, { count: 'exact' })
    .eq('parent_id', commentId)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })
    .range(page.offset, page.offset + page.limit - 1)

  if (error) {
    return databaseErrorResponse(c, error, 'Failed to fetch comment replies')
  }

  const replyChildren =
    data.length === 0
      ? { data: [], error: null }
      : await supabase
          .from('comments')
          .select('parent_id')
          .in(
            'parent_id',
            data.map((reply) => reply.id)
          )
  if (replyChildren.error) {
    return databaseErrorResponse(
      c,
      replyChildren.error,
      'Failed to check nested replies'
    )
  }
  const parentsWithReplies = new Set(
    replyChildren.data.map((row) => row.parent_id)
  )
  const replyRows = data.map((reply) => ({
    ...reply,
    has_replies: parentsWithReplies.has(reply.id),
  }))
  const engaged = await attachEngagement(c, replyRows, sessionData.user?.id)
  if (engaged.error) {
    return databaseErrorResponse(
      c,
      engaged.error,
      'Failed to fetch reply engagement'
    )
  }

  return c.json<CommentPage<CommentReplySummary>>({
    items: engaged.data,
    hasMore: page.offset + engaged.data.length < (count ?? 0),
    totalCount: count ?? 0,
  })
})

/** Get reactions for a comment */
comments.get('/:commentId/reactions', async (c) => {
  const commentId = requiredParam(c, 'commentId')
  const supabase = createSupabaseClient(c)

  const result = await fetchAllEngagementRows<CommentReactionWithUser>(
    (offset, pageSize) =>
      supabase
        .from('comment_reactions')
        .select(COMMENT_REACTION_WITH_USER_SELECT, { count: 'exact' })
        .eq('comment_id', commentId)
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
        .range(offset, offset + pageSize - 1)
  )

  if (result.error) {
    return databaseErrorResponse(c, result.error, 'Failed to fetch reactions')
  }
  // comment_reactions has no Json columns — no narrowing needed.
  return c.json<Array<CommentReactionWithUser>>(result.data)
})

/** Reply to a comment */
comments.post('/:commentId/replies', authMiddleware, async (c) => {
  const user = c.get('user')
  const commentId = requiredParam(c, 'commentId')
  const supabase = createSupabaseClient(c)
  const { content } = await c.req.json<{
    content?: unknown
  }>()

  if (!isCommentPortableTextValue(content)) {
    return c.json({ error: 'Comment content has an invalid structure' }, 400)
  }
  if (
    portableTextJsonByteLength(content) >
    PORTABLE_TEXT_LIMITS.commentMaximumBytes
  ) {
    return c.json(
      {
        error: COMMENT_STRINGS.validation.maximumSize(
          PORTABLE_TEXT_LIMITS.commentMaximumBytes
        ),
      },
      400
    )
  }

  if (
    portableTextToPlainText(content).trim().length <
    PORTABLE_TEXT_LIMITS.commentMinimumCharacters
  ) {
    return c.json(
      {
        error: COMMENT_STRINGS.validation.replyMinimumLength(
          PORTABLE_TEXT_LIMITS.commentMinimumCharacters
        ),
      },
      400
    )
  }

  const { data: parentComment, error: parentError } = await supabase
    .from('comments')
    .select('script_id, professor_id')
    .eq('id', commentId)
    .maybeSingle()
  if (parentError) {
    return databaseErrorResponse(c, parentError, 'Failed to fetch reply parent')
  }
  if (!parentComment) return c.json({ error: 'Comment not found' }, 404)

  // A reply inherits its parent's target, so it inherits the study gate too.
  const studyId = parentComment.script_id
    ? await studyIdForScript(supabase, parentComment.script_id)
    : null
  if (parentComment.script_id && !studyId) {
    return c.json({ error: 'Script not found' }, 404)
  }
  if (
    parentComment.script_id &&
    !(await canWriteInStudy(supabase, user.id, studyId))
  ) {
    return c.json(STUDY_WRITE_DENIED_BODY, 403)
  }

  if (isCommentRateLimited(user.id, 'reply', studyId)) {
    return c.json({ error: 'Too many replies. Please try again later.' }, 429)
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      author_id: user.id,
      content,
      parent_id: commentId,
      professor_id: parentComment.professor_id,
      script_id: parentComment.script_id,
    })
    .select(COMMENT_CREATE_SELECT)
    .single()

  if (error) {
    return databaseErrorResponse(c, error, 'Failed to create comment reply')
  }

  await checkCommentsPosted(c, user.id, studyId)
  await revalidateCacheTags(c.env, commentMutationTags(data))

  const verified = withVerifiedScriptTitle(data)
  const reply: CommentCreateResult = {
    ...verified,
    reactions_count: 0,
    reactions_by_type: {},
    likes_count: 0,
    my_reactions: [],
    liked_by_me: false,
  }

  return c.json<{ success: true; reply: CommentCreateResult }>({
    success: true,
    reply,
  })
})

/** Toggle one reaction type for the current user. */
comments.post('/:commentId/reactions', authMiddleware, async (c) => {
  const user = c.get('user')
  const commentId = requiredParam(c, 'commentId')
  if (isEngagementRateLimited(user.id)) {
    return c.json(
      { error: 'Too many reactions or likes. Please try again later.' },
      429
    )
  }
  const supabase = createSupabaseClient(c)
  const { reaction_type } = await c.req.json<{ reaction_type?: unknown }>()
  const reactionType =
    typeof reaction_type === 'string' ? reaction_type.trim() : ''

  if (!isReactionType(reactionType)) {
    return c.json(
      {
        error: 'reaction_type must be one of: like, hate, funny, sad, confused',
      },
      400
    )
  }

  const { data: parentComment, error: parentError } = await supabase
    .from('comments')
    .select('script_id, professor_id, author_id')
    .eq('id', commentId)
    .maybeSingle()
  if (parentError) {
    return databaseErrorResponse(
      c,
      parentError,
      'Failed to fetch reaction target'
    )
  }
  if (!parentComment) return c.json({ error: 'Comment not found' }, 404)
  if (parentComment.author_id === user.id) {
    return c.json({ error: 'You cannot react to your own comment' }, 403)
  }

  const { data: existingReaction, error: existingReactionError } =
    await supabase
      .from('comment_reactions')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .eq('reaction_type', reactionType)
      .maybeSingle()

  if (existingReactionError) {
    return databaseErrorResponse(
      c,
      existingReactionError,
      'Failed to read comment reaction'
    )
  }

  const { error } = existingReaction
    ? await supabase
        .from('comment_reactions')
        .delete()
        .eq('id', existingReaction.id)
    : await supabase.from('comment_reactions').insert({
        comment_id: commentId,
        reaction_type: reactionType,
        user_id: user.id,
      })

  if (error) {
    return databaseErrorResponse(c, error, 'Failed to update comment reaction')
  }
  await revalidateCacheTags(c.env, commentMutationTags(parentComment))

  return c.json<CommentReactionToggleResponse>({
    success: true,
    reacted: !existingReaction,
    reaction_type: reactionType,
  })
})

/** Toggle the current user's like on a comment */
comments.post('/:commentId/like', authMiddleware, async (c) => {
  const user = c.get('user')
  const commentId = requiredParam(c, 'commentId')
  if (isEngagementRateLimited(user.id)) {
    return c.json(
      { error: 'Too many reactions or likes. Please try again later.' },
      429
    )
  }
  const supabase = createSupabaseClient(c)

  const { data: parentComment, error: parentError } = await supabase
    .from('comments')
    .select('script_id, professor_id, author_id')
    .eq('id', commentId)
    .maybeSingle()
  if (parentError) {
    return databaseErrorResponse(c, parentError, 'Failed to fetch like target')
  }
  if (!parentComment) return c.json({ error: 'Comment not found' }, 404)
  if (parentComment.author_id === user.id) {
    return c.json({ error: 'You cannot like your own comment' }, 403)
  }

  const { data: existingLike, error: existingLikeError } = await supabase
    .from('comment_likes')
    .select('comment_id')
    .eq('comment_id', commentId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (existingLikeError) {
    return databaseErrorResponse(
      c,
      existingLikeError,
      'Failed to read comment like'
    )
  }

  if (existingLike) {
    const { error } = await supabase
      .from('comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', user.id)

    if (error)
      return databaseErrorResponse(c, error, 'Failed to remove comment like')
    await revalidateCacheTags(c.env, commentMutationTags(parentComment))
    return c.json({ success: true, liked: false })
  }

  const { error } = await supabase
    .from('comment_likes')
    .insert({ comment_id: commentId, user_id: user.id })

  if (error) {
    return databaseErrorResponse(c, error, 'Failed to add comment like')
  }
  await revalidateCacheTags(c.env, commentMutationTags(parentComment))
  return c.json({ success: true, liked: true })
})

comments.post('/', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  const { content, professor_id, script_id } = await c.req.json<{
    content?: unknown
    professor_id?: string
    script_id?: string
  }>()

  if (
    !isCommentPortableTextValue(content) ||
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
  if (
    portableTextJsonByteLength(content) >
    PORTABLE_TEXT_LIMITS.commentMaximumBytes
  ) {
    return c.json(
      {
        error: COMMENT_STRINGS.validation.maximumSize(
          PORTABLE_TEXT_LIMITS.commentMaximumBytes
        ),
      },
      400
    )
  }

  if (
    portableTextToPlainText(content).trim().length <
    PORTABLE_TEXT_LIMITS.commentMinimumCharacters
  ) {
    return c.json(
      {
        error: COMMENT_STRINGS.validation.minimumLength(
          PORTABLE_TEXT_LIMITS.commentMinimumCharacters
        ),
      },
      400
    )
  }

  // A comment on a script belongs to that script's study, so the writer has to
  // belong there too. A professor comment has no study and keeps the older rule.
  const studyId = script_id ? await studyIdForScript(supabase, script_id) : null
  if (script_id && !studyId) {
    return c.json({ error: 'Script not found' }, 404)
  }
  if (script_id && !(await canWriteInStudy(supabase, user.id, studyId))) {
    return c.json(STUDY_WRITE_DENIED_BODY, 403)
  }

  if (isCommentRateLimited(user.id, 'comment', studyId)) {
    return c.json({ error: 'Too many comments. Please try again later.' }, 429)
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

  if (error) {
    return databaseErrorResponse(c, error, 'Failed to create comment')
  }

  await checkCommentsPosted(c, user.id, studyId)
  await revalidateCacheTags(c.env, commentMutationTags(data))

  const verified = withVerifiedScriptTitle(data)
  const comment: CommentCreateResult = {
    ...verified,
    reactions_count: 0,
    reactions_by_type: {},
    likes_count: 0,
    my_reactions: [],
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
    !isCommentPortableTextValue(content) ||
    portableTextToPlainText(content).trim().length <
      PORTABLE_TEXT_LIMITS.commentMinimumCharacters
  ) {
    return c.json(
      {
        error: COMMENT_STRINGS.validation.minimumLength(
          PORTABLE_TEXT_LIMITS.commentMinimumCharacters
        ),
      },
      400
    )
  }
  if (
    portableTextJsonByteLength(content) >
    PORTABLE_TEXT_LIMITS.commentMaximumBytes
  ) {
    return c.json(
      {
        error: COMMENT_STRINGS.validation.maximumSize(
          PORTABLE_TEXT_LIMITS.commentMaximumBytes
        ),
      },
      400
    )
  }

  // Check if user is the author or an admin (RLS's UPDATE policy already
  // allows either — this mirrors that instead of only checking authorship).
  const [
    { data: profile, error: profileError },
    { data: existingComment, error: existingCommentError },
  ] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase
      .from('comments')
      .select('author_id, script_id')
      .eq('id', commentId)
      .maybeSingle(),
  ])
  if (profileError) {
    return databaseErrorResponse(c, profileError, 'Failed to fetch editor role')
  }
  if (existingCommentError) {
    return databaseErrorResponse(
      c,
      existingCommentError,
      'Failed to fetch comment'
    )
  }
  if (!existingComment) return c.json({ error: 'Comment not found' }, 404)

  if (
    existingComment.author_id !== user.id &&
    !isOwner(profile.role) &&
    !(await requireStudyRole(
      supabase,
      user.id,
      await studyIdForScript(supabase, existingComment.script_id),
      'moderator'
    ))
  ) {
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

  if (error) return databaseErrorResponse(c, error, 'Failed to update comment')

  await revalidateCacheTags(c.env, commentMutationTags(data))
  const engagement = await attachEngagement(c, [data], user.id)
  if (engagement.error) {
    return databaseErrorResponse(
      c,
      engagement.error,
      'Failed to fetch updated comment engagement'
    )
  }

  const updatedComment = engagement.data[0]
  if (!updatedComment) {
    return databaseErrorResponse(
      c,
      { message: 'Updated comment engagement result is missing' },
      'Failed to fetch updated comment engagement'
    )
  }

  return c.json<{ success: true; comment: CommentSummary }>({
    success: true,
    comment: updatedComment,
  })
})

/** Delete a comment (by author or admin) */
comments.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const commentId = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)

  // Get user's role and comment author/target (target needed for cache
  // revalidation after delete, since the row won't exist to look up then)
  const [
    { data: profile, error: profileError },
    { data: comment, error: commentError },
  ] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase
      .from('comments')
      .select('author_id, script_id, professor_id, content')
      .eq('id', commentId)
      .maybeSingle(),
  ])
  if (profileError) {
    return databaseErrorResponse(
      c,
      profileError,
      'Failed to fetch moderator role'
    )
  }
  if (commentError) {
    return databaseErrorResponse(c, commentError, 'Failed to fetch comment')
  }
  if (!comment) return c.json({ error: 'Comment not found' }, 404)

  // The comment's study comes from its script; a comment on a professor has none.
  const commentStudyId = await studyIdForScript(supabase, comment.script_id)

  // Check if user is author or admin
  const canModerate =
    isOwner(profile.role) ||
    (await requireStudyRole(supabase, user.id, commentStudyId, 'moderator'))

  if (comment.author_id !== user.id && !canModerate) {
    return c.json(
      {
        error: 'Unauthorized: You can only delete your own comments',
      },
      403
    )
  }

  const { data: deletedComment, error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .select('id')
    .maybeSingle()

  if (error) return databaseErrorResponse(c, error, 'Failed to delete comment')
  if (!deletedComment) return c.json({ error: 'Comment not found' }, 404)

  if (canModerate && comment.author_id !== user.id) {
    const title = isCommentPortableTextValue(comment.content)
      ? portableTextToPlainText(comment.content).trim().slice(0, 120) ||
        'Comment'
      : 'Comment'
    await notifyProfileBestEffort(c, comment.author_id, {
      type: 'content_removed',
      title: NOTIFICATION_ROW_STRINGS.contentRemovedTitle(title),
      body: NOTIFICATION_ROW_STRINGS.contentRemovedBody('comment'),
      data: { target_kind: 'comment', title },
      studyId: commentStudyId,
    })
  }

  let target: Awaited<ReturnType<typeof countTargetComments>>
  if (comment.script_id) {
    target = await countTargetComments(supabase, 'script_id', comment.script_id)
  } else if (comment.professor_id) {
    target = await countTargetComments(
      supabase,
      'professor_id',
      comment.professor_id
    )
  } else {
    return databaseErrorResponse(
      c,
      { message: 'Deleted comment has no supported target' },
      'Failed to recount comments'
    )
  }
  if (target.error) {
    return databaseErrorResponse(c, target.error, 'Failed to recount comments')
  }
  await revalidateCacheTags(c.env, commentMutationTags(comment))
  return c.json({
    success: true,
    message: 'Comment deleted successfully',
    totalCommentCount: target.count ?? 0,
  })
})

/** Get flagged comments (admin only) */
comments.get('/flagged/all', authMiddleware, requireAdminAccess, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError) {
    return databaseErrorResponse(c, profileError, 'Failed to verify admin role')
  }
  if (!isOwner(profile?.role)) {
    return c.json({ error: 'Unauthorized: Admin access required' }, 403)
  }

  const internalSupabase = createInternalSupabaseClient(c)
  const { data, error } = await internalSupabase
    .from('comments')
    .select(`
        ${PUBLIC_COMMENT_COLUMNS},
        author:profiles!author_id(username, full_name, avatar_url),
        flags:flags(*, reporter:profiles!reporter_id(username))
      `)
    .eq('is_flagged', true)
    .order('created_at', { ascending: false })

  if (error) {
    return databaseErrorResponse(c, error, 'Failed to fetch flagged comments')
  }
  return c.json<Array<CommentFlaggedSummary>>(data)
})

export default comments
