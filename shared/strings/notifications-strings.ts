import { DEFAULT_LOCALE } from '../config/localization-constants'
import type { LocalizedText } from '../types/localization.types'
import type { NotificationKind } from '../types/notifications.types'
import { getStrings, mkCount } from '../utils/localized-strings'

const formatDate = (value: string) => new Date(value).toLocaleDateString()

/**
 * The word a flag sentence names its target with. The API passes the raw
 * `target_type` (`'user' | 'script' | 'comment'`), so an unknown value falls
 * back to the raw string rather than dropping the sentence.
 */
const FLAG_TARGET_NOUN: Record<string, LocalizedText> = {
  user: { en: 'user', mk: 'корисник' },
  script: { en: 'script', mk: 'скрипта' },
  comment: { en: 'comment', mk: 'коментар' },
}

/**
 * The notifications the app builds in the client (the tray, the account
 * reminder, a restriction notice fetched with the session) — the reader's
 * language is known where they render, so these are translated.
 *
 * `row` is the same for notifications the **server writes into a row**: the API
 * still stores the sentence (`NOTIFICATION_ROW_STRINGS` below is its English
 * view), but the tray rebuilds it in the reader's language from the row's
 * `type` and `data` — see `resolveStoredNotificationCopy` in
 * `shared/utils/notification-copy.ts`.
 */
export const NOTIFICATIONS_STRINGS_PACK = {
  trayTitle: { en: 'Notifications', mk: 'Известувања' },
  openNotifications: { en: 'Open notifications', mk: 'Отвори известувања' },
  openTarget: { en: 'Open target', mk: 'Отвори' },
  dismissAll: { en: 'Dismiss all', mk: 'Отстрани ги сите' },
  dismiss: { en: 'Dismiss notification', mk: 'Отстрани известување' },
  markAsRead: { en: 'Mark as read', mk: 'Означи како прочитано' },
  empty: { en: "You're all caught up.", mk: 'Нема нови известувања.' },
  loading: { en: 'Loading notifications…', mk: 'Се вчитуваат известувањата…' },
  loadError: {
    en: 'Could not load notifications.',
    mk: 'Не успеа вчитувањето на известувањата.',
  },
  updateError: {
    en: 'Could not update notifications.',
    mk: 'Не успеа ажурирањето на известувањата.',
  },
  retry: { en: 'Try again', mk: 'Обиди се повторно' },
  accountReminderTitle: { en: 'Create an account', mk: 'Создај сметка' },
  accountReminderBody: {
    en: 'Save your studies and progress so they follow you to any device.',
    mk: 'Зачувај ги студиите и напредокот за да те следат на секој уред.',
  },
  createAccount: { en: 'Create account', mk: 'Создај сметка' },
  restrictionTitle: {
    en: 'Your account is restricted',
    mk: 'Твојата сметка е ограничена',
  },
  restrictionNoticeBody: (
    reason: string,
    expiresAt: string | null
  ): LocalizedText => ({
    en: `${reason} ${expiresAt ? `Restricted until ${formatDate(expiresAt)}.` : 'This restriction is permanent.'}`,
    mk: `${reason} ${expiresAt ? `Ограничувањето трае до ${formatDate(expiresAt)}.` : 'Ограничувањето е трајно.'}`,
  }),
  row: {
    achievementTitle: (title: string): LocalizedText => ({
      en: `Achievement unlocked: ${title}`,
      mk: `Ново достигнување: ${title}`,
    }),
    restrictionAppliedTitle: {
      en: 'Account restriction applied',
      mk: 'Изречено ограничување на сметката',
    },
    restrictionAppliedBody: (
      reason: string,
      expiresAt: string | null
    ): LocalizedText => ({
      en: `Reason: ${reason}. ${expiresAt ? `Restricted until ${formatDate(expiresAt)}.` : 'This restriction is permanent.'}`,
      mk: `Причина: ${reason}. ${expiresAt ? `Ограничувањето трае до ${formatDate(expiresAt)}.` : 'Ограничувањето е трајно.'}`,
    }),
    restrictionLiftedTitle: {
      en: 'Account restriction lifted',
      mk: 'Укинато ограничување на сметката',
    },
    restrictionLiftedBody: {
      en: 'An administrator lifted the restriction on your account.',
      mk: 'Администратор го укина ограничувањето на твојата сметка.',
    },
    contentRemovedTitle: (title: string): LocalizedText => ({
      en: `Content removed: ${title}`,
      mk: `Отстранета содржина: ${title}`,
    }),
    contentRemovedBody: (kind: 'script' | 'comment'): LocalizedText => ({
      en: `An administrator removed your ${kind}.`,
      mk: `Администратор ти отстрани ${kind === 'script' ? 'скрипта' : 'коментар'}.`,
    }),
    flagThresholdTitle: {
      en: 'Flag review threshold reached',
      mk: 'Достигнат праг на пријави',
    },
    flagThresholdBody: (count: number, target: string): LocalizedText => {
      const noun = FLAG_TARGET_NOUN[target]
      return {
        en: `${count} distinct users have flagged ${noun?.en ?? target}.`,
        mk: `${mkCount(count, 'Различен корисник пријави', 'Различни корисници пријавија')} ${noun?.mk ?? target}.`,
      }
    },
  },
  /** The word over a notification that came from the server. */
  typeNames: {
    achievement_earned: { en: 'Achievement', mk: 'Достигнување' },
    content_removed: {
      en: 'Content removed',
      mk: 'Отстранета содржина',
    },
    restriction_lifted: {
      en: 'Restriction lifted',
      mk: 'Укинато ограничување',
    },
    restriction_applied: {
      en: 'Restriction applied',
      mk: 'Изречено ограничување',
    },
    flag_threshold: { en: 'Flag threshold', mk: 'Праг на пријави' },
    announcement: { en: 'Announcement', mk: 'Соопштение' },
  } as const satisfies Record<NotificationKind, LocalizedText>,
} as const

/** English view for call sites that have not adopted `useStrings` yet. */
export const NOTIFICATIONS_STRINGS = getStrings(
  NOTIFICATIONS_STRINGS_PACK,
  DEFAULT_LOCALE
)

/**
 * The English view of `NOTIFICATIONS_STRINGS_PACK.row`, for the API, which
 * writes the sentence into `notifications.title`/`body` at the moment the event
 * happens.
 *
 * The tray does not render that stored sentence when it can avoid it: it
 * rebuilds it in the reader's language from the row's `type` and `data` (see
 * `resolveStoredNotificationCopy`), which works for every row already written
 * too. The stored text stays as the fallback for a row whose arguments are
 * missing, and as what an announcement — typed by an admin, with no arguments
 * to rebuild from — reads as.
 */
export const NOTIFICATION_ROW_STRINGS = getStrings(
  NOTIFICATIONS_STRINGS_PACK.row,
  DEFAULT_LOCALE
)
