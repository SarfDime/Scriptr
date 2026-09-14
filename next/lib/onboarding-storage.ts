import {
  EMPTY_GUEST_ACADEMIC_DATA,
  type GuestAcademicData,
} from '@/types/onboarding.types'

const STORAGE_KEY = 'scriptr:guest-academic-data'

/** Reads guest academic data from localStorage. Safe on the server (returns
 * the empty shape) and tolerates corrupt/missing data. */
export const readGuestAcademicData = (): GuestAcademicData => {
  if (typeof window === 'undefined') return EMPTY_GUEST_ACADEMIC_DATA
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_GUEST_ACADEMIC_DATA
    return { ...EMPTY_GUEST_ACADEMIC_DATA, ...JSON.parse(raw) }
  } catch {
    return EMPTY_GUEST_ACADEMIC_DATA
  }
}

export const hasDismissedOnboarding = (): boolean =>
  readGuestAcademicData().onboardingDismissedAt !== null

export const writeGuestAcademicData = (data: GuestAcademicData) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Storage full or unavailable (e.g. private browsing) — fail silently.
  }
}

export const clearGuestAcademicData = () => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export const hasCompletedOnboarding = (): boolean =>
  readGuestAcademicData().onboardingCompletedAt !== null
