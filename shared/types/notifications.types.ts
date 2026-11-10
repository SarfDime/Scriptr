import type { Tables } from './database.types'

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
 * for every profile, or for one study's people when `studyId` is set. Length
 * limits match `shared/config/shared-constants.ts` and the `notifications`
 * table's CHECK constraints. */
export type BroadcastNotificationRequest = {
  title: string
  body?: string
  /** The study the announcement belongs to; `null`/omitted sends it to
   * everyone, platform-wide. */
  studyId?: string | null
}

/** Success body of `POST /api/admin/notifications`. `recipients` counts the
 * profiles the announcement was written for. */
export type BroadcastNotificationResponse = {
  success: true
  recipients: number
}

/** One of the caller's notifications as `GET /notifications` returns it: the
 * row, plus its study's site handle. The tray reads that handle to decide
 * whether a notification belongs to the study site in view, instead of resolving
 * a study id in the browser. */
export type NotificationWithStudy = Tables<'notifications'> & {
  study: { site_slug: string | null } | null
}
