import { apiRoutes } from '@shared/config/api-routes'
import type {
  CalendarNotesResponse,
  CalendarNotesSyncRequest,
  CalendarNotesSyncResponse,
} from '@shared/types/calendar-notes.types'
import { apiFetchRequired } from './next-api'

const noStore = { cache: 'no-store' } as const

/**
 * The caller's notes, tombstones included. Read once on login and on an
 * explicit "sync from" — never on every page load, since the local copy is the
 * source of truth between syncs.
 */
export const getMyCalendarNotes = () =>
  apiFetchRequired<CalendarNotesResponse>(apiRoutes.calendarNotes.index, {
    ...noStore,
  })

/** Pushes the changed notes and returns the profile's merged copy. */
export const syncMyCalendarNotes = (payload: CalendarNotesSyncRequest) =>
  apiFetchRequired<CalendarNotesSyncResponse>(apiRoutes.calendarNotes.sync, {
    method: 'POST',
    body: payload,
  })
