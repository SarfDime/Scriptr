import {
  CALENDAR_NOTE_BODY_MAX,
  CALENDAR_NOTE_TITLE_MAX,
  CALENDAR_NOTE_TYPES,
  CALENDAR_NOTES_MAX_PER_PROFILE,
  CALENDAR_NOTES_PER_DAY,
  type CalendarNoteType,
} from '../config/calendar'
import type {
  CalendarNote,
  CalendarNotesByDay,
} from '../types/calendar-notes.types'

/**
 * The pure half of calendar notes: validation, grouping and the merge rules.
 * Shared by the API (which validates a sync payload) and the browser (which
 * writes local notes and reconciles them with the profile), so both sides agree
 * on what a note is and which copy wins.
 */

const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const MAX_ID_LENGTH = 64
const MAX_NOTES_IN_PAYLOAD = CALENDAR_NOTES_MAX_PER_PROFILE

export const isCalendarNoteType = (value: unknown): value is CalendarNoteType =>
  CALENDAR_NOTE_TYPES.some((type) => type === value)

/** A real `YYYY-MM-DD` day, not merely a well-formed string. */
export const isCalendarDayKey = (value: unknown): value is string => {
  if (typeof value !== 'string' || !DAY_KEY_PATTERN.test(value)) return false
  const [year = 0, month = 1, day = 1] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

const clamp = (value: string, max: number) => value.trim().slice(0, max)

/**
 * One note from an untrusted source (local storage, or a sync payload).
 * Returns `null` for anything that is not a usable note, and clamps the text
 * fields rather than rejecting the whole payload over one long body.
 */
export const sanitizeCalendarNote = (value: unknown): CalendarNote | null => {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<Record<keyof CalendarNote, unknown>>

  const id = typeof candidate.id === 'string' ? candidate.id.trim() : ''
  if (!id || id.length > MAX_ID_LENGTH) return null
  if (!isCalendarDayKey(candidate.day)) return null
  if (!isCalendarNoteType(candidate.type)) return null

  const title =
    typeof candidate.title === 'string'
      ? clamp(candidate.title, CALENDAR_NOTE_TITLE_MAX)
      : ''
  if (!title) return null

  const body =
    typeof candidate.body === 'string'
      ? clamp(candidate.body, CALENDAR_NOTE_BODY_MAX)
      : ''
  const updatedAt =
    typeof candidate.updatedAt === 'string' &&
    Number.isFinite(Date.parse(candidate.updatedAt))
      ? candidate.updatedAt
      : null

  return {
    id,
    day: candidate.day,
    type: candidate.type,
    title,
    body: body || null,
    // A note without a usable timestamp is treated as just edited, so a broken
    // local copy cannot silently win or lose a merge by accident.
    updatedAt: updatedAt ?? new Date().toISOString(),
    deleted: candidate.deleted === true,
  }
}

/** A whole list, deduplicated by id (the last occurrence wins) and capped. */
export const sanitizeCalendarNotes = (value: unknown): Array<CalendarNote> => {
  if (!Array.isArray(value)) return []

  const byId = new Map<string, CalendarNote>()
  for (const item of value) {
    const note = sanitizeCalendarNote(item)
    if (note) byId.set(note.id, note)
  }

  return [...byId.values()].slice(0, MAX_NOTES_IN_PAYLOAD)
}

/** The notes to show, per day, with tombstones dropped. Days come back newest
 * edit first. */
export const groupNotesByDay = (
  notes: ReadonlyArray<CalendarNote>
): CalendarNotesByDay => {
  const byDay: CalendarNotesByDay = {}

  for (const note of notes) {
    if (note.deleted) continue
    byDay[note.day] = [...(byDay[note.day] ?? []), note]
  }

  for (const [day, dayNotes] of Object.entries(byDay)) {
    byDay[day] = [...dayNotes].sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt)
    )
  }

  return byDay
}

export const countNotesOnDay = (
  notes: ReadonlyArray<CalendarNote>,
  day: string
): number => notes.filter((note) => !note.deleted && note.day === day).length

/**
 * Whether another note may be added to this day. `excludeId` lets an edit of an
 * existing note count itself out.
 */
export const canAddNoteOnDay = (
  notes: ReadonlyArray<CalendarNote>,
  day: string,
  excludeId?: string
): boolean =>
  notes.filter(
    (note) => !note.deleted && note.day === day && note.id !== excludeId
  ).length < CALENDAR_NOTES_PER_DAY

/** The notes edited after a sync instant — what a push sends. */
export const notesChangedSince = (
  notes: ReadonlyArray<CalendarNote>,
  since: string | null
): Array<CalendarNote> => {
  if (!since) return [...notes]
  const cutoff = Date.parse(since)
  if (!Number.isFinite(cutoff)) return [...notes]

  return notes.filter((note) => Date.parse(note.updatedAt) > cutoff)
}

/**
 * Local and profile notes together, by id, newest edit winning. Tombstones are
 * kept: they are how a deletion travels. The result is what the browser should
 * store after learning the profile's copy.
 */
export const mergeCalendarNotes = (
  local: ReadonlyArray<CalendarNote>,
  remote: ReadonlyArray<CalendarNote>
): Array<CalendarNote> => {
  const byId = new Map<string, CalendarNote>()

  for (const note of [...local, ...remote]) {
    const existing = byId.get(note.id)
    if (
      !existing ||
      Date.parse(note.updatedAt) >= Date.parse(existing.updatedAt)
    ) {
      byId.set(note.id, note)
    }
  }

  return [...byId.values()]
}

const contentKey = (note: CalendarNote) =>
  [
    note.day,
    note.type,
    note.title,
    note.body ?? '',
    note.deleted ? '1' : '0',
  ].join('\u0000')

/**
 * Whether the local copy holds anything the profile does not, or holds a
 * different version of it — the case a "sync from" has to warn about, because
 * pulling would overwrite it. A note that is only local (never synced) counts,
 * since pulling does not bring it back.
 */
export const notesDifferFrom = (
  local: ReadonlyArray<CalendarNote>,
  remote: ReadonlyArray<CalendarNote>
): boolean => {
  const remoteById = new Map(remote.map((note) => [note.id, note]))

  return local.some((note) => {
    const match = remoteById.get(note.id)
    if (!match) return true
    return contentKey(match) !== contentKey(note)
  })
}

/** The local notes a "sync from" would discard, so the warning can say how
 * many. */
export const countNotesLostByPull = (
  local: ReadonlyArray<CalendarNote>,
  remote: ReadonlyArray<CalendarNote>
): number => {
  const remoteById = new Map(remote.map((note) => [note.id, note]))

  return local.filter((note) => {
    const match = remoteById.get(note.id)
    return !match || contentKey(match) !== contentKey(note)
  }).length
}
