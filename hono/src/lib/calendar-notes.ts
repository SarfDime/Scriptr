import {
  CALENDAR_NOTES_AUTO_SYNC_DAYS,
  CALENDAR_NOTES_MAX_PER_PROFILE,
  CALENDAR_NOTES_PER_DAY,
  CALENDAR_NOTES_SYNC_DAILY_LIMIT,
  CALENDAR_NOTES_SYNC_SHORT_LIMIT,
  CALENDAR_NOTES_SYNC_SHORT_MINUTES,
} from '../../../shared/config/calendar'
import type { CalendarNote } from '../../../shared/types/calendar-notes.types'
import {
  isCalendarNoteType,
  sanitizeCalendarNotes,
} from '../../../shared/utils/calendar-notes.utils'
import { createRateLimiter } from '../../../shared/utils/rate-limit'
import type { createSupabaseClient } from './supabase'

/**
 * The rules both sync directions share: the request shape (the per-note shape
 * is the browser's own sanitiser), the merge that decides which copy of a note
 * wins, the two caps, the sync allowance and the weekly automatic push.
 */

/** A sync carries the changed notes only, so this is generous by design. */
export const MAX_NOTES_PER_SYNC = CALENDAR_NOTES_MAX_PER_PROFILE

export type CalendarNotesSyncPayload = {
  since: string | null
  notes: Array<CalendarNote>
}

/** `null` when the body is not a usable sync payload. */
export const readCalendarNotesSyncPayload = (
  body: Record<string, unknown>
): CalendarNotesSyncPayload | null => {
  if (!Array.isArray(body.notes)) return null
  if (body.notes.length > MAX_NOTES_PER_SYNC) return null

  const since =
    typeof body.since === 'string' && Number.isFinite(Date.parse(body.since))
      ? body.since
      : null

  const notes = sanitizeCalendarNotes(body.notes)
  // A payload whose entries all failed validation is a client bug, not an empty
  // sync: refuse it rather than silently overwriting the profile with nothing.
  if (body.notes.length > 0 && notes.length === 0) return null

  return { since, notes }
}

/**
 * The daily cap, after the push: three live notes per study's day. Only live
 * notes count — a tombstone is what frees a slot.
 */
export const exceedsDailyNoteCap = (
  notes: ReadonlyArray<CalendarNote>
): boolean => {
  const perDay = new Map<string, number>()

  for (const note of notes) {
    if (note.deleted) continue
    const key = `${note.studyId}\u0000${note.day}`
    perDay.set(key, (perDay.get(key) ?? 0) + 1)
  }

  return [...perDay.values()].some((count) => count > CALENDAR_NOTES_PER_DAY)
}

/** The profile's note cap, tombstones included (they are bounded by the same
 * number of ids). */
export const exceedsProfileNoteCap = (
  notes: ReadonlyArray<CalendarNote>
): boolean => notes.length > CALENDAR_NOTES_MAX_PER_PROFILE

// ---------------------------------------------------------------------------
// The push
// ---------------------------------------------------------------------------

const NOTES_COLUMNS =
  'note_id, study_id, day, type, title, body, deleted, updated_at'

type NoteRow = {
  note_id: string
  study_id: string
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
        studyId: row.study_id,
        day: row.day,
        type: row.type,
        title: row.title,
        body: row.body,
        deleted: row.deleted,
        updatedAt: row.updated_at,
      }
    : null

/** The caller's notes, tombstones included — a sync needs the deletions too. */
export const readCalendarNotes = async (
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

export type CalendarNotesPushResult =
  | {
      status: 'ok'
      notes: Array<CalendarNote>
      /** Instant the push started at: nothing edited after it was sent. */
      syncedAt: string
    }
  /** `message` is already reader copy. */
  | { status: 'invalid'; message: string }
  | { status: 'error'; error: { code?: string; message: string } }

/**
 * Writes a push and answers with the profile's copy. A stored note newer than
 * the incoming one is kept, so a stale browser cannot roll an edit back; the
 * caps are checked against the merged result before anything is written.
 */
export const pushCalendarNotes = async (
  supabase: ReturnType<typeof createSupabaseClient>,
  profileId: string,
  payload: CalendarNotesSyncPayload
): Promise<CalendarNotesPushResult> => {
  const { notes: stored, error: readError } = await readCalendarNotes(
    supabase,
    profileId
  )
  if (readError) return { status: 'error', error: readError }

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
        profile_id: profileId,
        note_id: note.id,
        study_id: note.studyId,
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
    return {
      status: 'invalid',
      message: 'A day can hold at most three notes. Delete one before syncing.',
    }
  }
  if (exceedsProfileNoteCap([...merged.values()])) {
    return {
      status: 'invalid',
      message: 'The profile holds too many notes.',
    }
  }

  if (rows.length > 0) {
    const { error: writeError } = await supabase
      .from('profile_calendar_notes')
      .upsert(rows, { onConflict: 'profile_id,note_id' })
    if (writeError) return { status: 'error', error: writeError }
  }

  const { notes, error } = await readCalendarNotes(supabase, profileId)
  if (error) return { status: 'error', error }

  return { status: 'ok', notes: notes ?? [], syncedAt }
}

// ---------------------------------------------------------------------------
// Sync limits
// ---------------------------------------------------------------------------

/**
 * Both windows count every sync attempt — a push and a pull are one "sync" to a
 * reader — so together they are the whole allowance: three in any half hour,
 * twelve in a day.
 */
const CALENDAR_NOTES_SYNC_SHORT_WINDOW_MS =
  CALENDAR_NOTES_SYNC_SHORT_MINUTES * 60 * 1000
const CALENDAR_NOTES_SYNC_DAILY_WINDOW_MS = 24 * 60 * 60 * 1000

const isShortWindowLimited = createRateLimiter({
  limit: CALENDAR_NOTES_SYNC_SHORT_LIMIT,
  windowMs: CALENDAR_NOTES_SYNC_SHORT_WINDOW_MS,
})

const isDailyWindowLimited = createRateLimiter({
  limit: CALENDAR_NOTES_SYNC_DAILY_LIMIT,
  windowMs: CALENDAR_NOTES_SYNC_DAILY_WINDOW_MS,
})

/**
 * Records one sync attempt and says whether it is over either limit. Both
 * buckets are recorded on every call, so a client that keeps trying while
 * blocked keeps both windows closed.
 */
export const takeCalendarNotesSyncSlot = (
  profileId: string
): 'halfHour' | 'day' | null => {
  const daily = isDailyWindowLimited(profileId)
  const short = isShortWindowLimited(profileId)

  if (daily) return 'day'
  if (short) return 'halfHour'
  return null
}

// ---------------------------------------------------------------------------
// The automatic push
// ---------------------------------------------------------------------------

const AUTO_SYNC_WINDOW_MS = CALENDAR_NOTES_AUTO_SYNC_DAYS * 24 * 60 * 60 * 1000

/** Whether the profile's last automatic push is old enough for another one. A
 * missing or unreadable record counts as due, so a broken row cannot strand a
 * profile without a save. */
export const isCalendarNotesAutoSyncDue = (
  lastAutoSync: string | null,
  now: number = Date.now()
): boolean => {
  if (!lastAutoSync) return true
  const at = Date.parse(lastAutoSync)
  return !Number.isFinite(at) || now - at >= AUTO_SYNC_WINDOW_MS
}

/** The instant another automatic push may run: a week after the last one, or
 * now when there is no usable record to read. */
export const nextCalendarNotesAutoSyncAt = (
  lastAutoSync: string | null
): string => {
  const at = lastAutoSync ? Date.parse(lastAutoSync) : Number.NaN
  return new Date(
    Number.isFinite(at) ? at + AUTO_SYNC_WINDOW_MS : Date.now()
  ).toISOString()
}
