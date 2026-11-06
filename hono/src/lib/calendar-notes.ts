import {
  CALENDAR_NOTES_MAX_PER_PROFILE,
  CALENDAR_NOTES_PER_DAY,
  CALENDAR_NOTES_SYNC_DAILY_LIMIT,
  CALENDAR_NOTES_SYNC_SHORT_LIMIT,
  CALENDAR_NOTES_SYNC_SHORT_MINUTES,
} from '../../../shared/config/calendar'
import type { CalendarNote } from '../../../shared/types/calendar-notes.types'
import { sanitizeCalendarNotes } from '../../../shared/utils/calendar-notes.utils'
import { createRateLimiter } from '../../../shared/utils/rate-limit'

/**
 * Request-shape rules for the calendar-notes sync. The per-note shape is
 * validated by the shared sanitiser (the browser writes notes with the same
 * one); what is left is the whole-payload answer: how many notes may come in,
 * and whether the daily cap is respected after the push.
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
 * The daily cap, after the push: three live notes per day. Only live notes
 * count — a tombstone is what frees a slot.
 */
export const exceedsDailyNoteCap = (
  notes: ReadonlyArray<CalendarNote>
): boolean => {
  const perDay = new Map<string, number>()

  for (const note of notes) {
    if (note.deleted) continue
    perDay.set(note.day, (perDay.get(note.day) ?? 0) + 1)
  }

  return [...perDay.values()].some((count) => count > CALENDAR_NOTES_PER_DAY)
}

/** The profile's note cap, tombstones included (they are bounded by the same
 * number of ids). */
export const exceedsProfileNoteCap = (
  notes: ReadonlyArray<CalendarNote>
): boolean => notes.length > CALENDAR_NOTES_MAX_PER_PROFILE

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
