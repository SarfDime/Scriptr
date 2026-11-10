import { calendarDayKey } from './calendar'

/**
 * Dismissed calendar alerts, per browser. Nothing is stored server-side and
 * there is no API route: the map lives in `localStorage` under
 * `scriptr:calendar-dismissed` as `{ [eventId]: eventDateISO }`, so a dismissal
 * only hides the preview in this browser, and the badge keeps its count.
 *
 * Follows `study-setup-storage.ts`: a module-level subscriber list for changes
 * made in this tab, a `storage` listener for other tabs, and a snapshot cached
 * by the raw stored string so `useSyncExternalStore` gets one stable reference
 * per value.
 */
const STORAGE_KEY = 'scriptr:calendar-dismissed'

export type CalendarDismissals = Record<string, string>

const EMPTY: CalendarDismissals = {}

const listeners = new Set<() => void>()
let cachedRaw: string | null | undefined
let cachedMap: CalendarDismissals = EMPTY
let prunedOnce = false

const notify = () => {
  for (const listener of listeners) listener()
}

const readRaw = (): string | null => {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    // Storage unavailable (private browsing, a blocked origin): nothing is
    // dismissed as far as this tab can tell.
    return null
  }
}

const parse = (raw: string | null): CalendarDismissals => {
  if (!raw) return EMPTY

  try {
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object' || Array.isArray(value))
      return EMPTY

    const entries = Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string'
    )

    return entries.length > 0 ? Object.fromEntries(entries) : EMPTY
  } catch {
    // Corrupt payload: treat it as "nothing dismissed".
    return EMPTY
  }
}

const isExpired = (dayKey: string, todayKey: string) => dayKey < todayKey

/** Stable snapshot. */
export const readCalendarDismissals = (): CalendarDismissals => {
  if (typeof window === 'undefined') return EMPTY

  const raw = readRaw()
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cachedMap = parse(raw)
  }

  return cachedMap
}

/** The server, and the first client render during hydration, know of no
 * dismissals. */
export const getServerCalendarDismissals = (): CalendarDismissals => EMPTY

const write = (dismissals: CalendarDismissals) => {
  const raw =
    Object.keys(dismissals).length > 0 ? JSON.stringify(dismissals) : null

  try {
    if (raw === null) {
      window.localStorage.removeItem(STORAGE_KEY)
    } else {
      window.localStorage.setItem(STORAGE_KEY, raw)
    }
  } catch {
    // The write did not land, so the honest snapshot is "nothing dismissed".
    cachedRaw = undefined
    cachedMap = EMPTY
    notify()
    return
  }

  cachedRaw = raw
  cachedMap = dismissals
  notify()
}

/** Drops entries whose day has already passed, deleting the key when nothing is
 * left. Runs on the first subscription and on every dismiss. */
export const pruneCalendarDismissals = () => {
  if (typeof window === 'undefined') return

  const todayKey = calendarDayKey(Date.now())
  const current = readCalendarDismissals()
  const kept = Object.entries(current).filter(
    ([, dayKey]) => !isExpired(dayKey, todayKey)
  )
  if (kept.length === Object.keys(current).length) return

  write(Object.fromEntries(kept))
}

/**
 * Records every currently matching event with its own date, so a dismissal
 * only covers what the reader could see at that moment — a later event shows
 * the preview again.
 */
export const dismissCalendarEvents = (
  events: ReadonlyArray<{ id: string; date: string }>
) => {
  if (typeof window === 'undefined') return

  const todayKey = calendarDayKey(Date.now())
  const next: CalendarDismissals = {}

  for (const [id, dayKey] of Object.entries(readCalendarDismissals())) {
    if (!isExpired(dayKey, todayKey)) next[id] = dayKey
  }
  for (const event of events) next[event.id] = calendarDayKey(event.date)

  write(next)
}

export const subscribeToCalendarDismissals = (listener: () => void) => {
  if (typeof window === 'undefined') {
    return () => {
      // A server render has no browser subscription to tear down.
    }
  }

  listeners.add(listener)

  const handleStorage = (event: StorageEvent) => {
    // `key === null` is `clear()`, which drops this key too.
    if (event.key !== null && event.key !== STORAGE_KEY) return
    cachedRaw = undefined
    listener()
  }
  window.addEventListener('storage', handleStorage)

  if (!prunedOnce) {
    prunedOnce = true
    pruneCalendarDismissals()
  }

  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', handleStorage)
  }
}
