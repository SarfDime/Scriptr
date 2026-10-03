import type { AppNotification } from '@/types/notifications.types'

const STORAGE_KEY = 'scriptr:local-notifications'
const storageListeners = new Set<() => void>()
let cachedNotifications: Array<AppNotification> | null = null

export const readLocalNotifications = (): Array<AppNotification> => {
  if (typeof window === 'undefined') return []
  if (cachedNotifications) return cachedNotifications
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    cachedNotifications = raw ? JSON.parse(raw) : []
  } catch {
    cachedNotifications = []
  }
  return cachedNotifications ?? []
}

export const writeLocalNotifications = (
  notifications: Array<AppNotification>
) => {
  if (typeof window === 'undefined') return
  cachedNotifications = notifications
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
  } catch {
    // Keep the in-memory store usable when browser storage is unavailable.
  }
  for (const listener of storageListeners) listener()
}

export const subscribeToLocalNotifications = (listener: () => void) => {
  if (typeof window === 'undefined') {
    return () => {
      // Server-rendered snapshots do not have a browser subscription.
    }
  }

  storageListeners.add(listener)
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return
    cachedNotifications = null
    listener()
  }
  window.addEventListener('storage', handleStorage)

  return () => {
    storageListeners.delete(listener)
    window.removeEventListener('storage', handleStorage)
  }
}
