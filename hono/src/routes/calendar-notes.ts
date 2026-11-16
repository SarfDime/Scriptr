import { Hono } from 'hono'
import {
  CALENDAR_NOTES_AUTO_SYNC_DAYS,
  CALENDAR_NOTES_SYNC_DAILY_LIMIT,
  CALENDAR_NOTES_SYNC_SHORT_LIMIT,
  CALENDAR_NOTES_SYNC_SHORT_MINUTES,
} from '../../../shared/config/calendar'
import type {
  CalendarNotesAutoSyncResponse,
  CalendarNotesResponse,
  CalendarNotesSyncResponse,
} from '../../../shared/types/calendar-notes.types'
import {
  isCalendarNotesAutoSyncDue,
  nextCalendarNotesAutoSyncAt,
  pushCalendarNotes,
  readCalendarNotes,
  readCalendarNotesSyncPayload,
  takeCalendarNotesSyncSlot,
} from '../lib/calendar-notes'
import { databaseErrorResponse, readJsonBody } from '../lib/request'
import { authMiddleware, createSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

/**
 * Personal calendar notes (`profile_calendar_notes`). Notes are local-first, so
 * these routes are the only times the database is involved: a pull (`GET /`), a
 * push the reader asked for (`POST /sync`), and the automatic push the browser
 * attempts once a week (`POST /auto-sync`).
 *
 * All three count against the same sync allowance (three per half hour, twelve
 * per day) and pushing is refused for a restricted account, matching the write
 * policy on the tables. Session-only: this is the caller's own data, never
 * someone else's.
 */
const calendarNotes = new Hono<HonoEnv>()

calendarNotes.use('*', authMiddleware)

const limitedResponse = (window: 'halfHour' | 'day') =>
  ({
    error:
      window === 'day'
        ? `You can sync your notes ${CALENDAR_NOTES_SYNC_DAILY_LIMIT} times a day. Try again tomorrow.`
        : `You can sync your notes ${CALENDAR_NOTES_SYNC_SHORT_LIMIT} times every ${CALENDAR_NOTES_SYNC_SHORT_MINUTES} minutes. Try again shortly.`,
    code: 'limited' as const,
    retryAfterSeconds:
      window === 'day' ? 24 * 60 * 60 : CALENDAR_NOTES_SYNC_SHORT_MINUTES * 60,
  }) as const

const restrictedResponse = () =>
  ({
    error: 'Your account is restricted, so notes cannot be synced right now.',
    code: 'restricted' as const,
  }) as const

const isRestricted = async (
  supabase: ReturnType<typeof createSupabaseClient>,
  profileId: string
): Promise<boolean> => {
  const { data } = await supabase
    .from('profile_restrictions')
    .select('profile_id')
    .eq('profile_id', profileId)
    .maybeSingle()

  return Boolean(data)
}

/** The profile's own row: when its last automatic push ran. */
const readLastAutoSync = async (
  supabase: ReturnType<typeof createSupabaseClient>,
  profileId: string
) => {
  const { data, error } = await supabase
    .from('profile_calendar_notes_syncs')
    .select('auto_synced_at')
    .eq('profile_id', profileId)
    .maybeSingle()

  return { lastAutoSync: data?.auto_synced_at ?? null, error }
}

/** An automatic push with nothing to push — not due yet, or an empty payload —
 * is answered with the instant to try again, not with an error. */
const notDueResponse = (lastAutoSync: string | null) =>
  ({
    notes: null,
    syncedAt: null,
    nextAutoSyncAt: nextCalendarNotesAutoSyncAt(lastAutoSync),
  }) as const

/** The caller's notes, tombstones included — a pull needs the deletions too. */
calendarNotes.get('/', async (c) => {
  const user = c.get('user')
  const window = takeCalendarNotesSyncSlot(user.id)
  if (window) return c.json(limitedResponse(window), 429)

  const { notes, error } = await readCalendarNotes(
    createSupabaseClient(c),
    user.id
  )
  if (error) return databaseErrorResponse(c, error)

  return c.json<CalendarNotesResponse>({ notes })
})

/** Push the notes changed since the previous sync and answer with the merged
 * copy. */
calendarNotes.post('/sync', async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  if (await isRestricted(supabase, user.id)) {
    return c.json(restrictedResponse(), 403)
  }

  const window = takeCalendarNotesSyncSlot(user.id)
  if (window) return c.json(limitedResponse(window), 429)

  const payload = readCalendarNotesSyncPayload(await readJsonBody(c))
  if (!payload) {
    return c.json(
      {
        error: 'notes must be a list of at most 500 valid notes',
        code: 'invalid' as const,
      },
      400
    )
  }

  const pushed = await pushCalendarNotes(supabase, user.id, payload)
  if (pushed.status === 'invalid') {
    return c.json({ error: pushed.message, code: 'invalid' as const }, 400)
  }
  if (pushed.status === 'error') return databaseErrorResponse(c, pushed.error)

  return c.json<CalendarNotesSyncResponse>({
    notes: pushed.notes,
    syncedAt: pushed.syncedAt,
  })
})

/**
 * The automatic push. It carries the same payload as `/sync` and spends the
 * same allowance, but it runs at most once per profile per
 * `CALENDAR_NOTES_AUTO_SYNC_DAYS`: asking early is answered with
 * `{ notes: null }` and the instant to try again.
 *
 * The week is claimed after the write, so a failed write never burns it. Two
 * browsers racing both write — the same notes, merged the same way — and one
 * claim wins, which is all the week is about.
 */
calendarNotes.post('/auto-sync', async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  if (await isRestricted(supabase, user.id)) {
    return c.json(restrictedResponse(), 403)
  }

  const { lastAutoSync, error: readError } = await readLastAutoSync(
    supabase,
    user.id
  )
  if (readError) return databaseErrorResponse(c, readError)
  if (!isCalendarNotesAutoSyncDue(lastAutoSync)) {
    return c.json<CalendarNotesAutoSyncResponse>(notDueResponse(lastAutoSync))
  }

  const payload = readCalendarNotesSyncPayload(await readJsonBody(c))
  if (!payload) {
    return c.json(
      {
        error: 'notes must be a list of at most 500 valid notes',
        code: 'invalid' as const,
      },
      400
    )
  }
  if (payload.notes.length === 0) {
    return c.json<CalendarNotesAutoSyncResponse>(notDueResponse(lastAutoSync))
  }

  const window = takeCalendarNotesSyncSlot(user.id)
  if (window) return c.json(limitedResponse(window), 429)

  const pushed = await pushCalendarNotes(supabase, user.id, payload)
  if (pushed.status === 'invalid') {
    return c.json({ error: pushed.message, code: 'invalid' as const }, 400)
  }
  if (pushed.status === 'error') return databaseErrorResponse(c, pushed.error)

  const { data, error } = await supabase.rpc('claim_calendar_notes_auto_sync', {
    p_window_days: CALENDAR_NOTES_AUTO_SYNC_DAYS,
  })
  if (error) return databaseErrorResponse(c, error)

  const claim = data?.[0]
  return c.json<CalendarNotesAutoSyncResponse>({
    notes: pushed.notes,
    syncedAt: claim?.claimed ? pushed.syncedAt : null,
    nextAutoSyncAt: nextCalendarNotesAutoSyncAt(
      claim?.last_auto_sync ?? lastAutoSync
    ),
  })
})

export default calendarNotes
