export type AchievementNotificationPreference = 'show' | 'hide'

export type ProfilePreferences = {
  version: 1
  notifications: {
    toasts: boolean
    achievements: AchievementNotificationPreference
  }
}

export type StoredProfilePreferences =
  | ProfilePreferences
  | Record<string, never>

export type ProfilePreferencesPatch = {
  version?: 1
  notifications: Partial<ProfilePreferences['notifications']>
}

export type ProfilePreferencesResponse = {
  preferences: StoredProfilePreferences
}
