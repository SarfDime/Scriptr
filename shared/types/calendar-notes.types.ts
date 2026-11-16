import type { CalendarNoteType } from '@shared/config/calendar'

/**
 * A personal calendar note. Notes are local-first: they live in this browser
 * until the reader syncs them to their profile, and `updatedAt` is what decides
 * which side wins when the same note exists in both places.
 */
export type CalendarNote = {
  /** Client-generated, stable across syncs; the database keys on it. */
  id: string
  /** The study whose calendar the note was written on (`studies.id`). Notes are
   * per study: the same day can carry different notes in two studies. */
  studyId: string
  /** `YYYY-MM-DD` in `CALENDAR_TIME_ZONE`. */
  day: string
  type: CalendarNoteType
  title: string
  /** Optional detail; an empty string is stored as `null`. */
  body: string | null
  /** ISO instant of the last edit on either side. */
  updatedAt: string
  /** Tombstone: a deleted note is kept so the deletion can be synced. */
  deleted: boolean
}

/** The notes one study's day may hold, newest edit first. */
export type CalendarNotesByDay = Record<string, Array<CalendarNote>>

/** What `/calendar-notes` answers: every note of the caller's profile, across
 * studies; each note names its study. */
export type CalendarNotesResponse = {
  notes: Array<CalendarNote>
}

/** Push the notes changed since `since`, and get the profile's notes back. */
export type CalendarNotesSyncRequest = {
  /** ISO instant of the previous successful sync, or `null` for the first. */
  since: string | null
  notes: Array<CalendarNote>
}

export type CalendarNotesSyncResponse = {
  /** The profile's notes after the push, tombstones included. */
  notes: Array<CalendarNote>
  /** Sync instant to send as `since` next time. */
  syncedAt: string
}

/**
 * What the automatic push answers. A profile that is not due yet is not an
 * error: `notes` and `syncedAt` are `null`, and the caller waits for
 * `nextAutoSyncAt` before asking again.
 */
export type CalendarNotesAutoSyncResponse = {
  /** The profile's notes after the push, tombstones included. */
  notes: Array<CalendarNote> | null
  /** Sync instant to send as `since` next time; `null` when nothing was pushed. */
  syncedAt: string | null
  /** Earliest instant another automatic push may run. */
  nextAutoSyncAt: string
}

/**
 * Why a sync was refused, so the client can say something true: `restricted`
 * means the account is restricted, `limited` means the rate limit was hit.
 */
export type CalendarNotesSyncErrorCode = 'restricted' | 'limited' | 'invalid'

export type CalendarNotesSyncError = {
  error: string
  code: CalendarNotesSyncErrorCode
  /** Seconds until the limit frees up, when `code` is `limited`. */
  retryAfterSeconds?: number
}
