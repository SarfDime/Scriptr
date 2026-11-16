import { scriptMutationTags } from '@shared/config/cache-tags'
import type {
  VoteRow,
  VoteWithScript,
  VoteWithUser,
  VoteWithUserAndScript,
} from '@shared/types/votes.types'
import { Hono } from 'hono'
import { checkTotalScriptVotes } from '../lib/achievements'
import { revalidateCacheTags } from '../lib/cache-revalidate'
import { honoLog } from '../lib/logger'
import { databaseErrorResponse, requiredParam } from '../lib/request'
import { studyIdForScript } from '../lib/require-admin'
import {
  canWriteInStudy,
  STUDY_WRITE_DENIED_MESSAGE,
} from '../lib/study-access'
import { authMiddleware, createSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const votes = new Hono<HonoEnv>()

/**
 * Reused by `/user/:userId` and `/my-votes` — the two endpoints that select
 * the identical shape: every vote by one user, with the script it was cast
 * on and that script's subject name. Matches `VoteWithScript` in
 * `shared/types/votes.types.ts` exactly; keep the two in sync if this
 * changes.
 */
const VOTE_WITH_SCRIPT_SELECT =
  '*, script:scripts(id, title, subject:subjects(name))'

/** List all votes across all scripts */
votes.get('/', async (c) => {
  const supabase = createSupabaseClient(c)
  const { data, error } = await supabase
    .from('votes')
    .select('*, user:profiles(username), script:scripts(title)')
    .order('created_at', { ascending: false })

  if (error) return databaseErrorResponse(c, error)

  return c.json<Array<VoteWithUserAndScript>>(data)
})

/** List votes for a specific script */
votes.get('/script/:scriptId', async (c) => {
  const scriptId = requiredParam(c, 'scriptId')
  const supabase = createSupabaseClient(c)
  const { data, error } = await supabase
    .from('votes')
    .select('*, user:profiles(username)')
    .eq('script_id', scriptId)
    .order('created_at', { ascending: false })

  if (error) return databaseErrorResponse(c, error)
  return c.json<Array<VoteWithUser>>(data)
})

/** List votes cast by a specific user */
votes.get('/user/:userId', async (c) => {
  const userId = requiredParam(c, 'userId')
  const supabase = createSupabaseClient(c)
  const { data, error } = await supabase
    .from('votes')
    .select(VOTE_WITH_SCRIPT_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return databaseErrorResponse(c, error)
  return c.json<Array<VoteWithScript>>(data)
})

/** List the current user's votes */
votes.get('/my-votes', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)
  const { data, error } = await supabase
    .from('votes')
    .select(VOTE_WITH_SCRIPT_SELECT)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return databaseErrorResponse(c, error)
  return c.json<Array<VoteWithScript>>(data)
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

  if (error) return databaseErrorResponse(c, error)
  return c.json<VoteRow | null>(data)
})

/** Get vote counts and the nonnegative score for a script */
votes.get('/script/:scriptId/stats', async (c) => {
  const scriptId = requiredParam(c, 'scriptId')
  const supabase = createSupabaseClient(c)
  const { count: upvotes } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .eq('script_id', scriptId)

  return c.json<{ upvotes: number; score: number }>({
    upvotes: upvotes ?? 0,
    score: Math.max(0, upvotes ?? 0),
  })
})

/** Toggle the current user's +1 vote for a script. */
votes.post('/:scriptId', authMiddleware, async (c) => {
  const user = c.get('user')
  const scriptId = requiredParam(c, 'scriptId')
  const supabase = createSupabaseClient(c)

  // Voting is a write on the script's study, so it needs a relationship to it.
  const studyId = await studyIdForScript(supabase, scriptId)
  if (!studyId) return c.json({ error: 'Script not found' }, 404)
  if (!(await canWriteInStudy(supabase, user.id, studyId))) {
    return c.json({ error: STUDY_WRITE_DENIED_MESSAGE }, 403)
  }

  // Already strongly typed from the generated `toggle_vote` RPC signature
  // in shared/types/database.types.ts — no overrideTypes needed here.
  const { data, error } = await supabase
    .rpc('toggle_vote', { p_script_id: scriptId })
    .single()

  if (error) {
    if (error.code === '42501') {
      if (error.message === 'You cannot vote on your own script') {
        return c.json({ error: error.message }, 403)
      }
      return c.json({ error: 'Your account is restricted from voting' }, 403)
    }
    if (error.code === 'P0002') {
      return c.json({ error: 'Script not found' }, 404)
    }
    honoLog({
      logLevel: 'error',
      message: `Failed to toggle vote for script ${scriptId}`,
      error,
    })
    return c.json({ error: 'Unable to update vote' }, 500)
  }

  const { data: script } = await supabase
    .from('scripts')
    .select('author_id, slug, subject_id, study_id')
    .eq('id', scriptId)
    .single()

  if (script?.author_id && script.subject_id) {
    // Award before invalidating: an award created after the revalidation would
    // be missed by the re-fetched public profile (tag `profiles:public`).
    await checkTotalScriptVotes(c, script.author_id, script.study_id)
    await revalidateCacheTags(
      c.env,
      scriptMutationTags({ id: scriptId, ...script })
    )
  }

  return c.json<{ voted: boolean; vote_score: number }>({
    voted: data.voted,
    vote_score: data.vote_score,
  })
})

export default votes
