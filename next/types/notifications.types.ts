import type { ComponentColorPalettes } from './components/ColorPalettes.types'

export type NotificationAction = {
  label: string
  kind: 'open-onboarding' | 'link'
  href?: string
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

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
  type?: NotificationType
}

/** Single source of truth for which `cp-*` palette each notification type
 * renders with — keep this in sync with `STYLING_GUIDE.md`'s palette list. */
export const NOTIFICATION_PALETTE: Record<
  NotificationType,
  ComponentColorPalettes
> = {
  info: 'cp-sky',
  success: 'cp-success',
  warning: 'cp-warning',
  error: 'cp-danger',
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
  push: (input: PushInput) => void
  dismiss: (id: string) => void
  dismissAll: () => void
  markRead: (id: string) => void
  markAllRead: () => void
}
