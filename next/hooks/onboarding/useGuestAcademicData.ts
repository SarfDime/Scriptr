'use client'

import { useSyncExternalStore } from 'react'
import {
  clearGuestAcademicData,
  readGuestAcademicData,
  subscribeToGuestAcademicData,
  writeGuestAcademicData,
} from '@/lib/onboarding-storage'
import {
  EMPTY_GUEST_ACADEMIC_DATA,
  type GuestAcademicData,
} from '@/types/onboarding.types'

/** Keeps React state in sync with the guest's localStorage academic data.
 * Server-rendered as the empty shape and hydrated through a subscribed
 * external store after hydration.
 */
export const useGuestAcademicData = () => {
  const data = useSyncExternalStore(
    subscribeToGuestAcademicData,
    readGuestAcademicData,
    () => EMPTY_GUEST_ACADEMIC_DATA
  )

  const update = (patch: Partial<GuestAcademicData>) => {
    writeGuestAcademicData({ ...readGuestAcademicData(), ...patch })
  }

  const clear = () => {
    clearGuestAcademicData()
  }

  return { data, update, clear }
}
