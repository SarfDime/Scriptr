import { DEFAULT_PROFILE_PREFERENCES } from '../../../shared/config/profile-preferences'
import type {
  ProfilePreferences,
  ProfilePreferencesPatch,
  StoredProfilePreferences,
} from '../../../shared/types/profile-preferences.types'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const hasOnlyKeys = (
  value: Record<string, unknown>,
  allowed: ReadonlyArray<string>
) => Object.keys(value).every((key) => allowed.includes(key))

const isEmptyRecord = (value: unknown): value is Record<string, never> =>
  isRecord(value) && Object.keys(value).length === 0

export const validateProfilePreferences = (
  value: unknown
): ProfilePreferences | null => {
  if (!isRecord(value) || !hasOnlyKeys(value, ['version', 'notifications'])) {
    return null
  }
  if (value.version !== 1 || !isRecord(value.notifications)) return null

  const notifications = value.notifications
  if (
    !hasOnlyKeys(notifications, ['toasts', 'achievements']) ||
    typeof notifications.toasts !== 'boolean' ||
    (notifications.achievements !== 'show' &&
      notifications.achievements !== 'hide')
  ) {
    return null
  }

  return {
    version: 1,
    notifications: {
      toasts: notifications.toasts,
      achievements: notifications.achievements,
    },
  }
}

export const readStoredProfilePreferences = (
  value: unknown
): StoredProfilePreferences | null =>
  isEmptyRecord(value) ? {} : validateProfilePreferences(value)

export const validateProfilePreferencesPatch = (
  value: unknown
): ProfilePreferencesPatch | null => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ['version', 'notifications']) ||
    (value.version !== undefined && value.version !== 1) ||
    !isRecord(value.notifications) ||
    !hasOnlyKeys(value.notifications, ['toasts', 'achievements'])
  ) {
    return null
  }

  const patch: ProfilePreferencesPatch['notifications'] = {}
  if (value.notifications.toasts !== undefined) {
    if (typeof value.notifications.toasts !== 'boolean') return null
    patch.toasts = value.notifications.toasts
  }
  if (value.notifications.achievements !== undefined) {
    if (
      value.notifications.achievements !== 'show' &&
      value.notifications.achievements !== 'hide'
    ) {
      return null
    }
    patch.achievements = value.notifications.achievements
  }
  if (Object.keys(patch).length === 0) return null

  return {
    version: 1,
    notifications: patch,
  }
}

export const mergeProfilePreferences = (
  current: unknown,
  patch: unknown
): ProfilePreferences | null => {
  const currentPreferences = readStoredProfilePreferences(current)
  const update = validateProfilePreferencesPatch(patch)
  if (!currentPreferences || !update) return null

  const base = isEmptyRecord(currentPreferences)
    ? DEFAULT_PROFILE_PREFERENCES
    : currentPreferences

  return {
    version: 1,
    notifications: {
      ...base.notifications,
      ...update.notifications,
    },
  }
}
