'use client'

const DEVICE_ID_KEY = 'scriptr:device-id'

/**
 * A stable id for this browser, sent as `x-device-id` on a counted download so
 * the API can deduplicate one that the account or the address alone cannot
 * (`docs/ARCHITECTURE-MODERATION.md`: account → IP → device). Without it every
 * `download_events` row has a null device and a rotated address counts twice.
 *
 * Empty when there is no storage (private mode, blocked storage) or no
 * `crypto.randomUUID` (insecure origin); the API then falls back to the
 * address, which is what it did before this existed.
 */
export const getDeviceId = (): string => {
  if (typeof window === 'undefined') return ''

  try {
    const stored = window.localStorage.getItem(DEVICE_ID_KEY)
    if (stored) return stored

    const created = window.crypto.randomUUID()
    window.localStorage.setItem(DEVICE_ID_KEY, created)
    return created
  } catch {
    return ''
  }
}
