'use client'

import {
  CALENDAR_NOTES_PER_DAY,
  type CalendarNoteType,
  DEFAULT_CALENDAR_NOTE_TYPE,
} from '@shared/config/calendar'
import { CALENDAR_STRINGS_PACK } from '@shared/strings/calendar-strings'
import type { CalendarNote } from '@shared/types/calendar-notes.types'
import type { ResolvedStrings } from '@shared/types/localization.types'
import {
  canAddNoteOnDay,
  groupNotesByDay,
  mergeCalendarNotes,
  notesChangedSince,
} from '@shared/utils/calendar-notes.utils'
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react'
import {
  getMyCalendarNotes,
  syncMyCalendarNotes,
} from '@/lib/api/calendar-notes-api'
import { ApiError } from '@/lib/api/next-api'
import {
  adoptLocalCalendarNotes,
  getServerCalendarNotes,
  hasFetchedCalendarNotes,
  markCalendarNotesFetched,
  readCalendarNotesSyncMarker,
  readLocalCalendarNotes,
  subscribeToCalendarNotes,
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
  notes: Array<CalendarNote>
  /** Live notes of one day, newest edit first. */
  notesForDay: (day: string) => Array<CalendarNote>
  canAddNote: (day: string) => boolean
  addNote: (day: string, draft: CalendarNoteDraft) => boolean
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
 * Owns the reader's calendar notes: the browser copy, the edits, and the two
 * sync directions.
 *
 * Nothing is fetched per page load. On login the profile's notes are pulled once
 * per browser (`hasFetchedCalendarNotes`), and after that only an explicit sync
 * talks to the API — which is also why the local copy stays the source of truth
 * while offline.
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

  // Signed-out notes move into the profile's namespace the first time that
  // profile signs in; the sync marker is read once so a reload keeps it.
  useEffect(() => {
    if (!userId) return
    adoptLocalCalendarNotes(userId)
    setLastSyncedAt(readCalendarNotesSyncMarker(userId))
  }, [userId])

  // One pull per login per browser, so the local copy carries whatever was
  // synced from another device without a fetch on every refresh.
  useEffect(() => {
    if (!userId || hasFetchedCalendarNotes(userId)) return

    let cancelled = false
    getMyCalendarNotes()
      .then(({ notes }) => {
        if (cancelled) return
        markCalendarNotesFetched(userId)
        writeLocalCalendarNotes(
          userId,
          mergeCalendarNotes(readLocalCalendarNotes(userId), notes)
        )
      })
      .catch(() => {
        // Leave the flag unset, so the next login tries again.
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  const notes = mounted ? stored : []
  const byDay = groupNotesByDay(notes)

  const notesForDay = (day: string) => byDay[day] ?? []

  const write = (next: Array<CalendarNote>) =>
    writeLocalCalendarNotes(userId, next)

  const addNote = (day: string, draft: CalendarNoteDraft): boolean => {
    if (!canAddNoteOnDay(notes, day)) {
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
      writeLocalCalendarNotes(userId, mergeCalendarNotes(notes, remote))
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
        canAddNote: (day) => canAddNoteOnDay(notes, day),
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
