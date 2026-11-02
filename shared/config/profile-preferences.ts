import type { ProfilePreferences } from '../types/profile-preferences.types'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const hasOnlyKeys = (value: Record<string, unknown>, keys: Array<string>) =>
  Object.keys(value).every((key) => keys.includes(key))

export const isProfilePreferences = (
  value: unknown
): value is ProfilePreferences => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ['version', 'notifications']) ||
    value.version !== 1 ||
    !isRecord(value.notifications) ||
    !hasOnlyKeys(value.notifications, ['toasts', 'achievements'])
  ) {
    return false
  }
  return (
    typeof value.notifications.toasts === 'boolean' &&
    (value.notifications.achievements === 'show' ||
      value.notifications.achievements === 'hide')
  )
}

export const DEFAULT_PROFILE_PREFERENCES: ProfilePreferences = {
  version: 1,
  notifications: {
    toasts: true,
    achievements: 'show',
  },
}
