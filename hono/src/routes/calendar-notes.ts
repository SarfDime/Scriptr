import { Hono } from 'hono'
import {
  CALENDAR_NOTES_SYNC_DAILY_LIMIT,
  CALENDAR_NOTES_SYNC_SHORT_LIMIT,
  CALENDAR_NOTES_SYNC_SHORT_MINUTES,
} from '../../../shared/config/calendar'
import type {
  CalendarNote,
  CalendarNotesResponse,
  CalendarNotesSyncResponse,
} from '../../../shared/types/calendar-notes.types'
import { isCalendarNoteType } from '../../../shared/utils/calendar-notes.utils'
import {
  exceedsDailyNoteCap,
  exceedsProfileNoteCap,
  readCalendarNotesSyncPayload,
  takeCalendarNotesSyncSlot,
} from '../lib/calendar-notes'
import { databaseErrorResponse, readJsonBody } from '../lib/request'
import { authMiddleware, createSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const NOTES_COLUMNS = 'note_id, day, type, title, body, deleted, updated_at'

type NoteRow = {
  note_id: string
  day: string
  /** `text` in the table, with a CHECK on the allowed values. */
  type: string
  title: string
  body: string | null
  deleted: boolean
  updated_at: string
}

/** `null` for a row whose type predates the CHECK (or was written around it),
 * so one bad row cannot make the whole list unreadable. */
const toNote = (row: NoteRow): CalendarNote | null =>
  isCalendarNoteType(row.type)
    ? {
        id: row.note_id,
        day: row.day,
        type: row.type,
        title: row.title,
        body: row.body,
        deleted: row.deleted,
        updatedAt: row.updated_at,
      }
    : null

/**
 * Personal calendar notes (`profile_calendar_notes`). Notes are local-first, so
 * these two routes are the only times the database is involved: a pull
 * (`GET /`) and a push that answers with the profile's copy (`POST /sync`).
 *
 * Both count against the same sync allowance (three per half hour, twelve per
 * day) and both are refused for a restricted account, matching the write policy
 * on the table. Session-only: this is the caller's own data, never someone
 * else's.
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

const readNotes = async (
  supabase: ReturnType<typeof createSupabaseClient>,
  profileId: string
) => {
  const { data, error } = await supabase
    .from('profile_calendar_notes')
    .select(NOTES_COLUMNS)
    .eq('profile_id', profileId)
    .order('updated_at', { ascending: true })

  if (error) return { notes: null, error }
  return {
    notes: (data ?? []).flatMap((row) => {
      const note = toNote(row)
      return note ? [note] : []
    }),
    error: null,
  }
}

/** The caller's notes, tombstones included — a pull needs the deletions too. */
calendarNotes.get('/', async (c) => {
  const user = c.get('user')
  const window = takeCalendarNotesSyncSlot(user.id)
  if (window) return c.json(limitedResponse(window), 429)

  const { notes, error } = await readNotes(createSupabaseClient(c), user.id)
  if (error) return databaseErrorResponse(c, error)

  return c.json<CalendarNotesResponse>({ notes })
})

/**
 * Push the notes changed since the previous sync and answer with the merged
 * copy. A stored note newer than the incoming one is kept, so a stale browser
 * cannot roll an edit back; the daily and per-profile caps are checked against
 * the merged result before anything is written.
 */
calendarNotes.post('/sync', async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  if (await isRestricted(supabase, user.id)) {
    return c.json(
      {
        error:
          'Your account is restricted, so notes cannot be synced right now.',
        code: 'restricted' as const,
      },
      403
    )
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

  const { notes: stored, error: readError } = await readNotes(supabase, user.id)
  if (readError) return databaseErrorResponse(c, readError)

  const storedById = new Map((stored ?? []).map((note) => [note.id, note]))
  const syncedAt = new Date().toISOString()

  const rows = payload.notes.flatMap((note) => {
    const existing = storedById.get(note.id)
    if (
      existing &&
      Date.parse(existing.updatedAt) > Date.parse(note.updatedAt)
    ) {
      return []
    }

    return [
      {
        profile_id: user.id,
        note_id: note.id,
        day: note.day,
        type: note.type,
        title: note.title,
        body: note.body,
        deleted: note.deleted,
        updated_at: note.updatedAt,
        synced_at: syncedAt,
      },
    ]
  })

  const merged = new Map(storedById)
  for (const note of payload.notes) {
    const existing = merged.get(note.id)
    if (
      !existing ||
      Date.parse(note.updatedAt) >= Date.parse(existing.updatedAt)
    ) {
      merged.set(note.id, note)
    }
  }

  if (exceedsDailyNoteCap([...merged.values()])) {
    return c.json(
      {
        error: 'A day can hold at most three notes. Delete one before syncing.',
        code: 'invalid' as const,
      },
      400
    )
  }
  if (exceedsProfileNoteCap([...merged.values()])) {
    return c.json(
      { error: 'The profile holds too many notes.', code: 'invalid' as const },
      400
    )
  }

  if (rows.length > 0) {
    const { error: writeError } = await supabase
      .from('profile_calendar_notes')
      .upsert(rows, { onConflict: 'profile_id,note_id' })
    if (writeError) return databaseErrorResponse(c, writeError)
  }

  const { notes, error } = await readNotes(supabase, user.id)
  if (error) return databaseErrorResponse(c, error)

  return c.json<CalendarNotesSyncResponse>({ notes: notes ?? [], syncedAt })
})

export default calendarNotes
