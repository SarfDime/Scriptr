import type { NotificationKind } from '@shared/types/notifications.types'
import type { ProfilePreferences } from '@shared/types/profile-preferences.types'
import type { ComponentColorPalettes } from './components/ColorPalettes.types'

export type NotificationAction = {
  /** The button's text. Absent on a notification mapped from a stored row: its
   * label would have been frozen in the language the row was written in, so
   * `NotificationRow` renders the reader's own wording instead. */
  label?: string
  kind: 'link'
  /** Where the action goes. A notification stored before actions were links
   * only may still carry no href; `NotificationRow` skips those. */
  href?: string
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error'
export type NotificationDisplayType = NotificationType | NotificationKind

export type AppNotification = {
  id: string
  title: string
  body?: string
  createdAt: string
  read: boolean
  dismissed: boolean
  /** Persistent notifications (e.g. the account-creation reminder) are
   * never removable via `dismiss`/`dismissAll` — only `markRead`/
   * `markAllRead` affect them. */
  persistent?: boolean
  action?: NotificationAction
  /** Drives the accent color in `NotificationsAside`. Defaults to `'info'`
   * wherever it's omitted (see `NOTIFICATION_PALETTE`). */
  type?: NotificationDisplayType
  sourceType?: NotificationKind
  /** The study site this notification belongs to; null or absent for a
   * platform-wide notification (and for local-only ones). */
  studySiteSlug?: string | null
}

/** Single source of truth for semantic and server-kind notification palettes. */
export const NOTIFICATION_PALETTE: Record<
  NotificationDisplayType,
  ComponentColorPalettes
> = {
  info: 'cp-sky',
  success: 'cp-success',
  warning: 'cp-warning',
  error: 'cp-danger',
  achievement_earned: 'cp-success',
  restriction_applied: 'cp-danger',
  restriction_lifted: 'cp-sky',
  content_removed: 'cp-danger',
  flag_threshold: 'cp-warning',
  announcement: 'cp-brand',
}

export type PushInput = {
  id?: string
  title: string
  body?: string
  action?: NotificationAction
  persistent?: boolean
  type?: NotificationType
}

export type NotificationsContextValue = {
  trayOpen: boolean
  setTrayOpen: (open: boolean) => void
  notifications: Array<AppNotification>
  unreadCount: number
  loading: boolean
  error: string | null
  refresh: () => void
  preferences: ProfilePreferences
  preferencesReady: boolean
  applyPreferences: (preferences: ProfilePreferences) => void
  syncRestriction: () => void
  /** The active restriction notice, or `null` when the user isn't restricted. */
  restrictionNotice: AppNotification | null
  restrictedModalOpen: boolean
  openRestrictedModal: () => void
  closeRestrictedModal: () => void
  push: (input: PushInput) => void
  dismiss: (id: string) => void
  dismissAll: () => void
  markRead: (id: string) => void
  markAllRead: () => void
}
