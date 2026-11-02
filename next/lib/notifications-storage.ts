import type { AppNotification } from '@/types/notifications.types'

const STORAGE_KEY = 'scriptr:local-notifications'
const storageListeners = new Map<string, Set<() => void>>()
const cachedNotifications = new Map<string, Array<AppNotification>>()

const getStorageKey = (userId?: string) => `${STORAGE_KEY}:${userId ?? 'guest'}`

export const readLocalNotifications = (
  userId?: string
): Array<AppNotification> => {
  if (typeof window === 'undefined') return []
  const key = getStorageKey(userId)
  const cached = cachedNotifications.get(key)
  if (cached) return cached
  try {
    const raw = window.localStorage.getItem(key)
    const notifications: Array<AppNotification> = raw ? JSON.parse(raw) : []
    cachedNotifications.set(key, notifications)
  } catch {
    cachedNotifications.set(key, [])
  }
  return cachedNotifications.get(key) ?? []
}

export const writeLocalNotifications = (
  notifications: Array<AppNotification>,
  userId?: string
) => {
  if (typeof window === 'undefined') return
  const key = getStorageKey(userId)
  cachedNotifications.set(key, notifications)
  try {
    window.localStorage.setItem(key, JSON.stringify(notifications))
  } catch {
    // Keep the in-memory store usable when browser storage is unavailable.
  }
  for (const listener of storageListeners.get(key) ?? []) listener()
}

export const subscribeToLocalNotifications = (
  listener: () => void,
  userId?: string
) => {
  if (typeof window === 'undefined') {
    return () => {
      // Server-rendered snapshots do not have a browser subscription.
    }
  }

  const key = getStorageKey(userId)
  const listeners = storageListeners.get(key) ?? new Set<() => void>()
  listeners.add(listener)
  storageListeners.set(key, listeners)
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== key) return
    cachedNotifications.delete(key)
    listener()
  }
  window.addEventListener('storage', handleStorage)

  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) storageListeners.delete(key)
    window.removeEventListener('storage', handleStorage)
  }
}
