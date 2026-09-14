'use client'

import { useState } from 'react'
import {
  clearGuestAcademicData,
  readGuestAcademicData,
  writeGuestAcademicData,
} from '@/lib/onboarding-storage'
import {
  EMPTY_GUEST_ACADEMIC_DATA,
  type GuestAcademicData,
} from '@/types/onboarding.types'
import { useMicrotaskEffect } from './useMicrotaskEffect'

/** Keeps React state in sync with the guest's localStorage academic data.
 * Server-rendered as the empty shape, hydrated from storage on mount.
 */
export const useGuestAcademicData = () => {
  const [data, setData] = useState<GuestAcademicData>(EMPTY_GUEST_ACADEMIC_DATA)

  useMicrotaskEffect(() => {
    setData(readGuestAcademicData())
  })

  const update = (patch: Partial<GuestAcademicData>) => {
    setData((current) => {
      const next = { ...current, ...patch }
      writeGuestAcademicData(next)
      return next
    })
  }

  const clear = () => {
    clearGuestAcademicData()
    setData(EMPTY_GUEST_ACADEMIC_DATA)
  }

  return { data, update, clear }
}
