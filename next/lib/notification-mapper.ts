import type { LocaleId } from '@shared/config/localization-constants'
import type {
  NotificationKind,
  NotificationWithStudy,
} from '@shared/types/notifications.types'
import { resolveStoredNotificationCopy } from '@shared/utils/notification-copy'
import type { AppNotification } from '@/types/notifications.types'

const isNotificationKind = (value: string): value is NotificationKind =>
  value === 'achievement_earned' ||
  value === 'restriction_applied' ||
  value === 'restriction_lifted' ||
  value === 'content_removed' ||
  value === 'flag_threshold' ||
  value === 'announcement'

const getHref = (record: NotificationWithStudy) => {
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

/**
 * A stored row as the tray shows it: the sentence is rebuilt in `locale` from
 * the row's `type` and `data`, so a notification written in the default
 * language still reads in the reader's own. `resolveStoredNotificationCopy`
 * documents what falls back to the stored text.
 */
export const mapNotificationRecord = (
  record: NotificationWithStudy,
  locale: LocaleId
): AppNotification => {
  const type = isNotificationKind(record.type) ? record.type : 'info'
  const sourceType = isNotificationKind(record.type) ? record.type : undefined

  const href = getHref(record)
  const copy = resolveStoredNotificationCopy(record, locale)
  return {
    id: `server:${record.id}`,
    title: copy.title,
    body: copy.body,
    createdAt: record.created_at,
    read: record.is_read,
    dismissed: false,
    type,
    sourceType,
    studySiteSlug: record.study?.site_slug ?? null,
    ...(href
      ? {
          action: { kind: 'link' as const, href },
        }
      : {}),
  }
}
