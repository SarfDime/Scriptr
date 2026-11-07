import { NOTIFICATIONS_STRINGS } from '@shared/strings/notifications-strings'
import type { NotificationRecord } from '@shared/types/api.types'
import type { NotificationKind } from '@shared/types/notifications.types'
import type { AppNotification } from '@/types/notifications.types'

const isNotificationKind = (value: string): value is NotificationKind =>
  value === 'achievement_earned' ||
  value === 'restriction_applied' ||
  value === 'restriction_lifted' ||
  value === 'content_removed' ||
  value === 'flag_threshold' ||
  value === 'announcement'

const getHref = (record: NotificationRecord) => {
  const data = record.data
  if (
    typeof data === 'object' &&
    data !== null &&
    !Array.isArray(data) &&
    'href' in data &&
    typeof data.href === 'string'
  ) {
    return data.href
  }
  return undefined
}

export const mapNotificationRecord = (
  record: NotificationRecord
): AppNotification => {
  const type = isNotificationKind(record.type) ? record.type : 'info'
  const sourceType = isNotificationKind(record.type) ? record.type : undefined

  const href = getHref(record)
  return {
    id: `server:${record.id}`,
    title: record.title,
    body: record.body ?? undefined,
    createdAt: record.created_at,
    read: record.is_read,
    dismissed: false,
    type,
    sourceType,
    ...(href
      ? {
          action: {
            label: NOTIFICATIONS_STRINGS.openTarget,
            kind: 'link' as const,
            href,
          },
        }
      : {}),
  }
}
