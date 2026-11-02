const formatDate = (value: string) => new Date(value).toLocaleDateString()

export const NOTIFICATIONS_STRINGS = {
  trayTitle: 'Notifications',
  openNotifications: 'Open notifications',
  openTarget: 'Open target',
  dismissAll: 'Dismiss all',
  dismiss: 'Dismiss notification',
  markAsRead: 'Mark as read',
  empty: "You're all caught up.",
  loading: 'Loading notifications…',
  loadError: 'Could not load notifications.',
  updateError: 'Could not update notifications.',
  retry: 'Try again',
  accountReminderTitle: 'Create an account',
  accountReminderBody:
    'Save your studies and progress so they follow you to any device.',
  createAccount: 'Create account',
  restrictionTitle: 'Your account is restricted',
  restrictionNoticeBody: (reason: string, expiresAt: string | null) =>
    `${reason} ${expiresAt ? `Restricted until ${formatDate(expiresAt)}.` : 'This restriction is permanent.'}`,
  achievementTitle: (title: string) => `Achievement unlocked: ${title}`,
  restrictionAppliedTitle: 'Account restriction applied',
  restrictionAppliedBody: (reason: string, expiresAt: string | null) =>
    `Reason: ${reason}. ${expiresAt ? `Restricted until ${formatDate(expiresAt)}.` : 'This restriction is permanent.'}`,
  restrictionLiftedTitle: 'Account restriction lifted',
  restrictionLiftedBody:
    'An administrator lifted the restriction on your account.',
  contentRemovedTitle: (title: string) => `Content removed: ${title}`,
  contentRemovedBody: (kind: 'script' | 'comment') =>
    `An administrator removed your ${kind}.`,
  flagThresholdTitle: 'Flag review threshold reached',
  flagThresholdBody: (count: number, target: string) =>
    `${count} distinct users have flagged ${target}.`,
} as const
