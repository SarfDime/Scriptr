import { Hono } from 'hono'
import {
  DOWNLOAD_REVIEW_ACCOUNT_SORT_OPTIONS,
  DOWNLOAD_REVIEW_SCRIPT_SORT_OPTIONS,
} from '../../../shared/config/shared-constants'
import type {
  DownloadReviewAccount,
  DownloadReviewEvent,
  DownloadReviewEventsResponse,
  DownloadReviewListResponse,
  DownloadReviewScript,
} from '../../../shared/types/download-review.types'
import { portableTextToPlainText } from '../../../shared/utils/portable-text.utils'
import { isUuid } from '../../../shared/utils/slug.utils'
import { requireAdminAccess } from '../lib/admin-access'
import {
  aggregateDownloadReview,
  DOWNLOAD_REVIEW_WINDOW,
  type DownloadReviewEventRow,
  downloadReviewIdentityType,
  pageDownloadReviewAccounts,
  pageDownloadReviewScripts,
} from '../lib/download-review'
import {
  parseDownloadReviewEventsQuery,
  parseDownloadReviewListQuery,
} from '../lib/download-review-query'
import { databaseErrorResponse } from '../lib/request'
import { requireAdmin } from '../lib/require-admin'
import {
  authMiddleware,
  createInternalSupabaseClient,
  createSupabaseClient,
} from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

/** One page of the window read; PostgREST caps a response, so the pass pages
 * through it rather than asking for the whole window at once. */
const WINDOW_PAGE_SIZE = 500

const WINDOW_SELECT = `script_id, user_id, ip_address, device_id, identity_key, created_at,
  script:scripts(slug, title), profile:profiles(username, full_name)`

/**
 * Suspicious-download review: what the counted downloads in `download_events`
 * add up to per account and per script, with the events behind one of them.
 *
 * Reads use the service-role client because RLS shows a user only their own
 * events, so the admin check is explicit and runs on the caller's session
 * client. The routes are on the normal session path like `/restrictions`, with
 * `requireAdminAccess` pinning the origin and demanding the unlock token.
 */
const downloadReview = new Hono<HonoEnv>()

downloadReview.use('*', authMiddleware)

const requireAdminSession = async (
  c: Parameters<typeof createSupabaseClient>[0]
) => {
  const user = c.get('user')
  if (!(await requireAdmin(createSupabaseClient(c), user.id))) {
    return c.json({ error: 'Unauthorized: Admin access required' }, 403)
  }
  return null
}

/** Newest events first, up to the window, plus the table's total so the lists
 * can say how much of the history the pass did not see. */
const readWindow = async (
  supabase: ReturnType<typeof createInternalSupabaseClient>
) => {
  const { count, error: countError } = await supabase
    .from('download_events')
    .select('id', { count: 'exact', head: true })
  if (countError) return { error: countError, rows: [], total: 0 }

  const rows: Array<DownloadReviewEventRow> = []
  while (rows.length < DOWNLOAD_REVIEW_WINDOW) {
    const from = rows.length
    const to = Math.min(from + WINDOW_PAGE_SIZE, DOWNLOAD_REVIEW_WINDOW) - 1
    const { data, error } = await supabase
      .from('download_events')
      .select(WINDOW_SELECT)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) return { error, rows: [], total: 0 }
    rows.push(
      ...data.map((row) => ({
        script_id: row.script_id,
        user_id: row.user_id,
        ip_address: row.ip_address,
        device_id: row.device_id,
        identity_key: row.identity_key,
        created_at: row.created_at,
        username: row.profile?.username ?? null,
        full_name: row.profile?.full_name ?? null,
        script_slug: row.script?.slug ?? null,
        script_title: row.script
          ? portableTextToPlainText(row.script.title)
          : null,
      }))
    )
    if (data.length < to - from + 1) break
  }

  return { error: null, rows, total: count ?? 0 }
}

type WindowMeta = {
  scanned: number
  total_events: number
  window: number
}

const windowMeta = (scanned: number, total: number): WindowMeta => ({
  scanned,
  total_events: total,
  window: DOWNLOAD_REVIEW_WINDOW,
})

/** The accounts with the most counted downloads in the window. */
downloadReview.get('/accounts', requireAdminAccess, async (c) => {
  const denied = await requireAdminSession(c)
  if (denied) return denied

  const query = parseDownloadReviewListQuery((name) => c.req.query(name), {
    sorts: DOWNLOAD_REVIEW_ACCOUNT_SORT_OPTIONS,
    defaultSort: 'events',
  })
  if (!query) {
    return c.json({ error: 'Invalid paging, sort or search parameters' }, 400)
  }

  const { error, rows, total } = await readWindow(
    createInternalSupabaseClient(c)
  )
  if (error) return databaseErrorResponse(c, error)

  const page = pageDownloadReviewAccounts(
    aggregateDownloadReview(rows).accounts,
    query
  )

  return c.json<DownloadReviewListResponse<DownloadReviewAccount>>({
    ...page,
    offset: query.offset,
    limit: query.limit,
    ...windowMeta(rows.length, total),
  })
})

/** The scripts with the most counted downloads in the window. */
downloadReview.get('/scripts', requireAdminAccess, async (c) => {
  const denied = await requireAdminSession(c)
  if (denied) return denied

  const query = parseDownloadReviewListQuery((name) => c.req.query(name), {
    sorts: DOWNLOAD_REVIEW_SCRIPT_SORT_OPTIONS,
    defaultSort: 'events',
  })
  if (!query) {
    return c.json({ error: 'Invalid paging, sort or search parameters' }, 400)
  }

  const { error, rows, total } = await readWindow(
    createInternalSupabaseClient(c)
  )
  if (error) return databaseErrorResponse(c, error)

  const page = pageDownloadReviewScripts(
    aggregateDownloadReview(rows).scripts,
    query
  )

  return c.json<DownloadReviewListResponse<DownloadReviewScript>>({
    ...page,
    offset: query.offset,
    limit: query.limit,
    ...windowMeta(rows.length, total),
  })
})

/** The events behind one account or one script, newest first. */
downloadReview.get('/events', requireAdminAccess, async (c) => {
  const denied = await requireAdminSession(c)
  if (denied) return denied

  const scriptId = c.req.query('script_id')?.trim() || null
  const profileId = c.req.query('user_id')?.trim() || null
  if (Boolean(scriptId) === Boolean(profileId)) {
    return c.json({ error: 'Pass exactly one of script_id or user_id' }, 400)
  }
  const invalidId = [scriptId, profileId].find((id) => id && !isUuid(id))
  if (invalidId) return c.json({ error: 'Invalid id' }, 400)

  const page = parseDownloadReviewEventsQuery((name) => c.req.query(name))
  if (!page) {
    return c.json({ error: 'Invalid paging parameters' }, 400)
  }

  const supabase = createInternalSupabaseClient(c)
  let query = supabase
    .from('download_events')
    .select(
      `id, created_at, script_id, user_id, ip_address, device_id, identity_key,
        script:scripts(slug, title), profile:profiles(username, full_name)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(page.offset, page.offset + page.limit - 1)

  if (scriptId) query = query.eq('script_id', scriptId)
  else if (profileId) query = query.eq('user_id', profileId)

  const { data, error, count } = await query
  if (error) return databaseErrorResponse(c, error)

  const events: Array<DownloadReviewEvent> = data.map((row) => ({
    id: row.id,
    created_at: row.created_at,
    script_id: row.script_id,
    script_slug: row.script?.slug ?? null,
    script_title: row.script ? portableTextToPlainText(row.script.title) : null,
    profile_id: row.user_id,
    username: row.profile?.username ?? null,
    full_name: row.profile?.full_name ?? null,
    ip_address: row.ip_address,
    device_id: row.device_id,
    identity: downloadReviewIdentityType(row.identity_key),
  }))

  return c.json<DownloadReviewEventsResponse>({
    events,
    total: count ?? events.length,
    offset: page.offset,
    limit: page.limit,
  })
})

export default downloadReview
