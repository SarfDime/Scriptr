'use client'

import { createContext, type ReactNode, useContext, useEffect } from 'react'
import {
  adoptLocalCalendarNotes,
  adoptUnassignedCalendarNotes,
} from '@/lib/calendar-notes-storage'
import { useSession } from '../SessionProvider'

/**
 * The study whose calendar is on screen. Notes are per study, so the islands
 * inside the calendar page scope their reads and writes with this rather than
 * threading the id through every grid and list. `null` when the study has no
 * database row: there is no study to key a note on, so the note controls stay
 * hidden.
 */
const CalendarStudyContext = createContext<string | null>(null)

export const CalendarStudyProvider = ({
  studyId,
  children,
}: {
  studyId: string | null
  children: ReactNode
}) => {
  const { session } = useSession()
  const userId = session.status === 'authenticated' ? session.user.id : null

  // A note written before the study scope existed is claimed by the first
  // calendar opened; signing in afterwards moves those notes to the profile.
  useEffect(() => {
    if (!studyId) return
    adoptUnassignedCalendarNotes(userId, studyId)
    if (userId) adoptLocalCalendarNotes(userId)
  }, [userId, studyId])

  return (
    <CalendarStudyContext.Provider value={studyId}>
      {children}
    </CalendarStudyContext.Provider>
  )
}

export const useCalendarStudyId = () => useContext(CalendarStudyContext)
