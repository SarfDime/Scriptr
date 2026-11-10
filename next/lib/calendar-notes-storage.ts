import type { CalendarNote } from '@shared/types/calendar-notes.types'
import { sanitizeCalendarNotes } from '@shared/utils/calendar-notes.utils'

/**
 * The browser's copy of the reader's calendar notes. Notes are local-first, so
 * this store is the source of truth between syncs; the profile's copy only
 * arrives on login or when the reader syncs.
 *
 * Follows `study-setup-storage.ts`: one module-level subscriber list for changes
 * made in this tab, a `storage` listener for other tabs, and a snapshot cached
 * by the raw stored string so `useSyncExternalStore` gets one stable reference.
 *
 * Notes are namespaced per profile, so two readers sharing a browser never see
 * or sync each other's notes. Signed-out notes live under `local` and are moved
 * into the profile's namespace the first time that profile signs in.
 */
const PREFIX = 'scriptr:calendar-notes'
const LOCAL_SCOPE = 'local'

const notesKey = (scope: string) => `${PREFIX}:${scope}`
const syncKey = (scope: string) => `${PREFIX}-sync:${scope}`
const fetchedKey = (userId: string) => `${PREFIX}-fetched:${userId}`

const EMPTY: Array<CalendarNote> = []

const listeners = new Set<() => void>()
let cachedKey: string | null = null
let cachedRaw: string | null | undefined
let cachedNotes: Array<CalendarNote> = EMPTY

const notify = () => {
  for (const listener of listeners) listener()
}

const scopeOf = (userId: string | null | undefined) => userId ?? LOCAL_SCOPE

const readRaw = (key: string): string | null => {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    // Storage unavailable (private browsing, a blocked origin).
    return null
  }
}

/** Stable snapshot for `useSyncExternalStore`. */
export const readLocalCalendarNotes = (
  userId: string | null | undefined
): Array<CalendarNote> => {
  if (typeof window === 'undefined') return EMPTY

  const key = notesKey(scopeOf(userId))
  const raw = readRaw(key)
  if (key === cachedKey && raw === cachedRaw) return cachedNotes

  cachedKey = key
  cachedRaw = raw
  cachedNotes = raw ? sanitizeCalendarNotes(parseJson(raw)) : EMPTY
  return cachedNotes
}

/** Corrupt storage reads as no notes rather than throwing during a render. */
const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export const getServerCalendarNotes = (): Array<CalendarNote> => EMPTY

const writeNotes = (
  userId: string | null | undefined,
  notes: Array<CalendarNote>
) => {
  if (typeof window === 'undefined') return

  const key = notesKey(scopeOf(userId))
  const raw = JSON.stringify(notes)
  try {
    if (notes.length > 0) {
      window.localStorage.setItem(key, raw)
    } else {
      window.localStorage.removeItem(key)
    }
  } catch {
    // The write did not land; the next read reflects storage, not this array.
    cachedRaw = undefined
    return
  }

  cachedKey = key
  cachedRaw = notes.length > 0 ? raw : null
  cachedNotes = notes
  notify()
}

/** Replaces the browser's copy for this profile. */
export const writeLocalCalendarNotes = (
  userId: string | null | undefined,
  notes: Array<CalendarNote>
) => writeNotes(userId, notes)

/** The instant of this profile's last successful sync, or `null`. */
export const readCalendarNotesSyncMarker = (
  userId: string | null | undefined
): string | null => {
  const raw = readRaw(syncKey(scopeOf(userId)))
  return raw && Number.isFinite(Date.parse(raw)) ? raw : null
}

export const writeCalendarNotesSyncMarker = (
  userId: string | null | undefined,
  syncedAt: string
) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(syncKey(scopeOf(userId)), syncedAt)
  } catch {
    // Without a marker the next sync simply sends everything again.
  }
}

/**
 * Whether this profile's notes were fetched in this browser already. The fetch
 * happens once per login per browser, not on every page load.
 */
export const hasFetchedCalendarNotes = (userId: string): boolean =>
  readRaw(fetchedKey(userId)) === '1'

export const markCalendarNotesFetched = (userId: string) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(fetchedKey(userId), '1')
  } catch {
    // It will fetch once more next time; nothing is lost.
  }
}

export const clearCalendarNotesFetched = (userId: string) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(fetchedKey(userId))
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}

/**
 * Carries signed-out notes into the profile's namespace the first time that
 * profile signs in, so adding notes before signing in does not lose them.
 */
export const adoptLocalCalendarNotes = (userId: string) => {
  const localNotes = readLocalCalendarNotes(null)
  if (localNotes.length === 0) return

  const existing = readLocalCalendarNotes(userId)
  const known = new Set(existing.map((note) => note.id))
  writeNotes(userId, [
    ...existing,
    ...localNotes.filter((note) => !known.has(note.id)),
  ])
  writeNotes(null, [])
}

export const subscribeToCalendarNotes = (listener: () => void) => {
  if (typeof window === 'undefined') {
    return () => {
      // A server render has no browser subscription to tear down.
    }
  }

  listeners.add(listener)

  const handleStorage = (event: StorageEvent) => {
    // `key === null` is `clear()`, which drops these keys too.
    if (event.key !== null && !event.key.startsWith(PREFIX)) return
    cachedRaw = undefined
    listener()
  }
  window.addEventListener('storage', handleStorage)

  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', handleStorage)
  }
}
