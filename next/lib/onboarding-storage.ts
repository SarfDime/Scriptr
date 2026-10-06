import {
  EMPTY_GUEST_ACADEMIC_DATA,
  type GuestAcademicData,
} from '@/types/onboarding.types'

const STORAGE_KEY = 'scriptr:guest-academic-data'
const storageListeners = new Set<() => void>()
let cachedData: GuestAcademicData | null = null

const notifyStorageListeners = () => {
  for (const listener of storageListeners) listener()
}

/** Reads guest academic data from localStorage. Safe on the server (returns
 * the empty shape) and tolerates corrupt/missing data. */
export const readGuestAcademicData = (): GuestAcademicData => {
  if (typeof window === 'undefined') return EMPTY_GUEST_ACADEMIC_DATA
  if (cachedData) return cachedData
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    cachedData = raw
      ? { ...EMPTY_GUEST_ACADEMIC_DATA, ...JSON.parse(raw) }
      : EMPTY_GUEST_ACADEMIC_DATA
  } catch {
    cachedData = EMPTY_GUEST_ACADEMIC_DATA
  }
  return cachedData ?? EMPTY_GUEST_ACADEMIC_DATA
}

export const hasDismissedOnboarding = (): boolean =>
  readGuestAcademicData().onboardingDismissedAt !== null

export const writeGuestAcademicData = (data: GuestAcademicData) => {
  if (typeof window === 'undefined') return
  cachedData = data
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Storage full or unavailable (e.g. private browsing) — fail silently.
  }
  notifyStorageListeners()
}

export const clearGuestAcademicData = () => {
  if (typeof window === 'undefined') return
  cachedData = EMPTY_GUEST_ACADEMIC_DATA
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
  notifyStorageListeners()
}

export const hasCompletedOnboarding = (): boolean =>
  readGuestAcademicData().onboardingCompletedAt !== null

export const subscribeToGuestAcademicData = (listener: () => void) => {
  if (typeof window === 'undefined') {
    return () => {
      // Server-rendered snapshots do not have a browser subscription.
    }
  }

  storageListeners.add(listener)
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return
    cachedData = null
    listener()
  }
  window.addEventListener('storage', handleStorage)

  return () => {
    storageListeners.delete(listener)
    window.removeEventListener('storage', handleStorage)
  }
}
