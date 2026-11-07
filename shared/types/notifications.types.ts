export type NotificationKind =
  | 'achievement_earned'
  | 'restriction_applied'
  | 'restriction_lifted'
  | 'content_removed'
  | 'flag_threshold'
  | 'announcement'

export type ModerationNotificationKind = Exclude<
  NotificationKind,
  'achievement_earned'
>

export type FlagThresholdNotificationData = {
  target_type: 'user' | 'script' | 'comment'
  target_id: string
  count: number
  href: string
}

/** Body of `POST /api/admin/notifications`: one `announcement` notification
 * for every profile. Length limits match `shared/config/shared-constants.ts`
 * and the `notifications` table's CHECK constraints. */
export type BroadcastNotificationRequest = {
  title: string
  body?: string
}

/** Success body of `POST /api/admin/notifications`. `recipients` counts the
 * profiles the announcement was written for. */
export type BroadcastNotificationResponse = {
  success: true
  recipients: number
}
