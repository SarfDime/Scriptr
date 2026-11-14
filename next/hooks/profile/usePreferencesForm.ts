'use client'

import { PREFERENCES_STRINGS_PACK } from '@shared/strings/preferences-strings'
import type { ProfilePreferences } from '@shared/types/profile-preferences.types'
import { useState } from 'react'
import { updateMyProfilePreferences } from '@/lib/api/profile-api'
import { useStrings } from '@/providers/locale/use-strings'
import { useNotifications } from '@/providers/notification/NotificationProvider'
import { useToast } from '@/providers/toaster/ToasterProvider'

type NotificationEdits = Partial<ProfilePreferences['notifications']>

/** Edits the locally cached preferences. Nothing is fetched here: the
 * provider loads them once on login, and saving writes them back. */
export const usePreferencesForm = () => {
  const {
    preferences,
    preferencesReady,
    error,
    loading,
    refresh,
    applyPreferences,
  } = useNotifications()
  const strings = useStrings(PREFERENCES_STRINGS_PACK)
  const [edits, setEdits] = useState<NotificationEdits>({})
  const [saving, setSaving] = useState(false)
  const { addToast } = useToast()

  const draft: ProfilePreferences | null = preferencesReady
    ? {
        ...preferences,
        notifications: { ...preferences.notifications, ...edits },
      }
    : null
  const dirty =
    draft !== null &&
    (draft.notifications.toasts !== preferences.notifications.toasts ||
      draft.notifications.achievements !==
        preferences.notifications.achievements)
  const loadError = !preferencesReady && !loading && error !== null

  const updateNotifications = (patch: NotificationEdits) =>
    setEdits((current) => ({ ...current, ...patch }))

  const save = (onSaved: () => void) => {
    if (!draft || !dirty) return
    setSaving(true)
    updateMyProfilePreferences({
      version: 1,
      notifications: draft.notifications,
    })
      .then(({ preferences: saved }) => {
        addToast({ type: 'success', title: strings.saved })
        applyPreferences({ ...draft, ...saved })
        onSaved()
      })
      .catch(() => addToast({ type: 'error', title: strings.saveError }))
      .finally(() => setSaving(false))
  }

  return {
    draft,
    dirty,
    loadError,
    saving,
    load: refresh,
    updateNotifications,
    save,
  }
}
