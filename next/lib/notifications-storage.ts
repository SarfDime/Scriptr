import type { AppNotification } from '@/types/notifications.types'

const STORAGE_KEY = 'scriptr:local-notifications'

export const readLocalNotifications = (): Array<AppNotification> => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export const writeLocalNotifications = (
  notifications: Array<AppNotification>
) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
}
