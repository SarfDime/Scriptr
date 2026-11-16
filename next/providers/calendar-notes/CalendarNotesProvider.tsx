'use client'

import {
  CALENDAR_NOTES_AUTO_SYNC_RETRY_MINUTES,
  CALENDAR_NOTES_PER_DAY,
  type CalendarNoteType,
  DEFAULT_CALENDAR_NOTE_TYPE,
} from '@shared/config/calendar'
import { CALENDAR_STRINGS_PACK } from '@shared/strings/calendar-strings'
import type { CalendarNote } from '@shared/types/calendar-notes.types'
import type { ResolvedStrings } from '@shared/types/localization.types'
import {
  calendarNotesDigest,
  canAddNoteOnDay,
  groupNotesByDay,
  mergeCalendarNotes,
  notesChangedSince,
} from '@shared/utils/calendar-notes.utils'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import {
  autoSyncMyCalendarNotes,
  getMyCalendarNotes,
  syncMyCalendarNotes,
} from '@/lib/api/calendar-notes-api'
import { ApiError } from '@/lib/api/next-api'
import {
  adoptLocalCalendarNotes,
  getServerCalendarNotes,
  hasFetchedCalendarNotes,
  markCalendarNotesFetched,
  readCalendarNotesAutoSyncAt,
  readCalendarNotesDigest,
  readCalendarNotesSyncMarker,
  readLocalCalendarNotes,
  subscribeToCalendarNotes,
  writeCalendarNotesAutoSyncAt,
  writeCalendarNotesDigest,
  writeCalendarNotesSyncMarker,
  writeLocalCalendarNotes,
} from '@/lib/calendar-notes-storage'
import { useStrings } from '@/providers/locale/use-strings'
import { useToast } from '@/providers/toaster/ToasterProvider'
import { useSession } from '../SessionProvider'

export type CalendarNoteDraft = {
  type: CalendarNoteType
  title: string
  body: string | null
}

type CalendarNotesContextValue = {
  /** False until the browser copy has been read, so an unhydrated render never
   * claims a day has no notes. */
  ready: boolean
  /** Every study's notes of this profile. */
  notes: Array<CalendarNote>
  /** Live notes of one study's day, newest edit first. */
  notesForDay: (studyId: string, day: string) => Array<CalendarNote>
  canAddNote: (studyId: string, day: string) => boolean
  addNote: (studyId: string, day: string, draft: CalendarNoteDraft) => boolean
  updateNote: (id: string, draft: CalendarNoteDraft) => void
  deleteNote: (id: string) => void
  signedIn: boolean
  syncing: boolean
  lastSyncedAt: string | null
  pullProfileNotes: () => Promise<Array<CalendarNote> | null>
  applyPulledNotes: (notes: Array<CalendarNote>) => void
  pushNotes: () => Promise<boolean>
}

const CalendarNotesContext = createContext<CalendarNotesContextValue | null>(
  null
)

const subscribeToMount = () => () => {
  // Mounting is a one-way trip; there is nothing to unsubscribe from.
}
const getMounted = () => true
const getServerMounted = () => false

/** `true` only after hydration, so the server render and the first client
 * render agree about what is in storage. */
const useMounted = () =>
  useSyncExternalStore(subscribeToMount, getMounted, getServerMounted)

const newNoteId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `note-${Date.now()}-${Math.floor(Math.random() * 1e6)}`

type CalendarStrings = ResolvedStrings<typeof CALENDAR_STRINGS_PACK>

/** A refusal from the API is already reader copy; anything else keeps the
 * generic line. */
const syncErrorMessage = (strings: CalendarStrings, error: unknown) =>
  error instanceof ApiError && (error.status === 429 || error.status === 403)
    ? error.message
    : strings.note.syncFailed

/**
 * Owns the reader's calendar notes: the browser copy, the edits, and the sync
 * directions.
 *
 * Nothing is fetched per page load. On login the profile's notes are pulled once
 * per browser (`hasFetchedCalendarNotes`), a push the reader asks for runs from
 * Preferences, and an automatic push saves whatever this browser changed once a
 * week — so the local copy stays the source of truth while offline.
 */
export const CalendarNotesProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const strings = useStrings(CALENDAR_STRINGS_PACK)
  const { session } = useSession()
  const { addToast } = useToast()
  const mounted = useMounted()
  const userId = session.status === 'authenticated' ? session.user.id : null

  const stored = useSyncExternalStore(
    subscribeToCalendarNotes,
    () => readLocalCalendarNotes(userId),
    getServerCalendarNotes
  )
  const [syncing, setSyncing] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  /** True once the once-per-login pull has finished (or was not needed), so an
   * automatic push never runs ahead of it. */
  const [pullSettled, setPullSettled] = useState(false)
  /** One automatic push at a time: an edit while one is in the air would
   * otherwise spend a second slot on the same notes. */
  const autoSyncInFlightRef = useRef(false)

  // Signed-out notes move into the profile's namespace the first time that
  // profile signs in; the sync marker is read once so a reload keeps it.
  useEffect(() => {
    if (!userId) return
    adoptLocalCalendarNotes(userId)
    setLastSyncedAt(readCalendarNotesSyncMarker(userId))
  }, [userId])

  /** Records the profile's copy and the digest of the browser copy that now
   * matches it, so the next automatic push has something to compare against. */
  const rememberProfileCopy = useCallback(
    (profileCopy: Array<CalendarNote>) => {
      if (!userId) return
      const merged = mergeCalendarNotes(
        readLocalCalendarNotes(userId),
        profileCopy
      )
      writeLocalCalendarNotes(userId, merged)
      writeCalendarNotesDigest(userId, calendarNotesDigest(merged))
    },
    [userId]
  )

  // One pull per login per browser, so the local copy carries whatever was
  // synced from another device without a fetch on every refresh.
  useEffect(() => {
    setPullSettled(false)
    if (!userId) return
    if (hasFetchedCalendarNotes(userId)) {
      setPullSettled(true)
      return
    }

    let cancelled = false
    getMyCalendarNotes()
      .then(({ notes }) => {
        if (cancelled) return
        markCalendarNotesFetched(userId)
        rememberProfileCopy(notes)
      })
      .catch(() => {
        // Leave the flag unset, so the next login tries again.
      })
      .finally(() => {
        if (!cancelled) setPullSettled(true)
      })

    return () => {
      cancelled = true
    }
  }, [userId, rememberProfileCopy])

  // The automatic push: only when this browser holds notes the profile has not
  // seen, and at most once the profile's week is up — which the API keeps, so
  // another browser cannot spend it twice. It stays silent: the reader sees it
  // as "last synced" in Preferences.
  useEffect(() => {
    if (!userId || !mounted || !pullSettled) return
    if (autoSyncInFlightRef.current) return

    const knownDue = readCalendarNotesAutoSyncAt(userId)
    if (knownDue && Date.parse(knownDue) > Date.now()) return

    // The digest is of the copy the profile held when this browser last read
    // it, so a pull — or a reload after one — leaves nothing to send, while a
    // single edit does. A missing digest falls back to the sync marker.
    const syncedDigest = readCalendarNotesDigest(userId)
    const since = readCalendarNotesSyncMarker(userId)
    const changed =
      syncedDigest && syncedDigest === calendarNotesDigest(stored)
        ? []
        : notesChangedSince(stored, since)
    if (changed.length === 0) return

    autoSyncInFlightRef.current = true
    autoSyncMyCalendarNotes({ since, notes: changed })
      .then(({ notes: remote, syncedAt, nextAutoSyncAt }) => {
        writeCalendarNotesAutoSyncAt(userId, nextAutoSyncAt)
        if (remote) {
          rememberProfileCopy(remote)
          markCalendarNotesFetched(userId)
        }
        if (syncedAt) {
          writeCalendarNotesSyncMarker(userId, syncedAt)
          setLastSyncedAt(syncedAt)
        }
      })
      .catch((error: unknown) => {
        // Wait before asking again rather than on every page load; the API's own
        // week is the rule, this only spares requests after a refusal.
        const retryAfterSeconds =
          error instanceof ApiError
            ? Number(error.data?.retryAfterSeconds)
            : Number.NaN
        writeCalendarNotesAutoSyncAt(
          userId,
          new Date(
            Date.now() +
              (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
                ? retryAfterSeconds * 1000
                : CALENDAR_NOTES_AUTO_SYNC_RETRY_MINUTES * 60 * 1000)
          ).toISOString()
        )
      })
      .finally(() => {
        autoSyncInFlightRef.current = false
      })
  }, [userId, mounted, pullSettled, stored, rememberProfileCopy])

  const notes = mounted ? stored : []
  const byStudy = new Map(
    [...new Set(notes.map((note) => note.studyId))].map((studyId) => [
      studyId,
      groupNotesByDay(notes, studyId),
    ])
  )

  const notesForDay = (studyId: string, day: string) =>
    byStudy.get(studyId)?.[day] ?? []

  const write = (next: Array<CalendarNote>) =>
    writeLocalCalendarNotes(userId, next)

  const addNote = (
    studyId: string,
    day: string,
    draft: CalendarNoteDraft
  ): boolean => {
    if (!canAddNoteOnDay(notes, studyId, day)) {
      addToast({
        type: 'warning',
        title: strings.note.limitReached(CALENDAR_NOTES_PER_DAY),
      })
      return false
    }

    write([
      ...notes,
      {
        id: newNoteId(),
        studyId,
        day,
        type: draft.type ?? DEFAULT_CALENDAR_NOTE_TYPE,
        title: draft.title,
        body: draft.body,
        updatedAt: new Date().toISOString(),
        deleted: false,
      },
    ])
    return true
  }

  const updateNote = (id: string, draft: CalendarNoteDraft) => {
    const updatedAt = new Date().toISOString()
    write(
      notes.map((note) =>
        note.id === id
          ? {
              ...note,
              type: draft.type,
              title: draft.title,
              body: draft.body,
              updatedAt,
            }
          : note
      )
    )
  }

  const deleteNote = (id: string) => {
    if (!notes.some((note) => note.id === id)) return

    // A tombstone, not a removal: the deletion still has to reach the profile.
    const updatedAt = new Date().toISOString()
    write(
      notes.map((note) =>
        note.id === id ? { ...note, deleted: true, updatedAt } : note
      )
    )
  }

  const pullProfileNotes = async (): Promise<Array<CalendarNote> | null> => {
    if (!userId) return null
    setSyncing(true)
    try {
      const { notes: remote } = await getMyCalendarNotes()
      return remote
    } catch (error) {
      addToast({ type: 'error', title: syncErrorMessage(strings, error) })
      return null
    } finally {
      setSyncing(false)
    }
  }

  const applyPulledNotes = (remote: Array<CalendarNote>) => {
    if (!userId) return
    const syncedAt = new Date().toISOString()
    // A pull replaces the local copy outright: the warning before it already
    // said which local notes it was about to discard.
    writeLocalCalendarNotes(userId, mergeCalendarNotes([], remote))
    writeCalendarNotesDigest(userId, calendarNotesDigest(remote))
    writeCalendarNotesSyncMarker(userId, syncedAt)
    setLastSyncedAt(syncedAt)
    markCalendarNotesFetched(userId)
  }

  const pushNotes = async (): Promise<boolean> => {
    if (!userId) {
      addToast({ type: 'info', title: strings.note.requiresSignIn })
      return false
    }

    setSyncing(true)
    try {
      const since = readCalendarNotesSyncMarker(userId)
      const { notes: remote, syncedAt } = await syncMyCalendarNotes({
        since,
        notes: notesChangedSince(notes, since),
      })
      rememberProfileCopy(remote)
      writeCalendarNotesSyncMarker(userId, syncedAt)
      setLastSyncedAt(syncedAt)
      markCalendarNotesFetched(userId)
      return true
    } catch (error) {
      addToast({ type: 'error', title: syncErrorMessage(strings, error) })
      return false
    } finally {
      setSyncing(false)
    }
  }

  return (
    <CalendarNotesContext.Provider
      value={{
        ready: mounted,
        notes,
        notesForDay,
        canAddNote: (studyId, day) => canAddNoteOnDay(notes, studyId, day),
        addNote,
        updateNote,
        deleteNote,
        signedIn: userId !== null,
        syncing,
        lastSyncedAt,
        pullProfileNotes,
        applyPulledNotes,
        pushNotes,
      }}
    >
      {children}
    </CalendarNotesContext.Provider>
  )
}

export const useCalendarNotes = () => {
  const context = useContext(CalendarNotesContext)
  if (!context) {
    throw new Error(
      'useCalendarNotes must be used within CalendarNotesProvider'
    )
  }
  return context
}
