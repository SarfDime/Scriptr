export type NotificationKind =
  | 'achievement_earned'
  | 'restriction_applied'
  | 'restriction_lifted'
  | 'content_removed'
  | 'flag_threshold'

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
