import { DEFAULT_LOCALE } from '../config/localization-constants'
import { getStrings } from '../utils/localized-strings'

/** Every reader-facing string of the preferences modal. The `{ en, mk }`
 * entries are the source of truth; `PREFERENCES_STRINGS` below is the English
 * view for call sites that have not adopted `useStrings` yet. */
export const PREFERENCES_STRINGS_PACK = {
  title: { en: 'Preferences', mk: 'Поставки' },
  openLabel: { en: 'Preferences', mk: 'Поставки' },
  notifications: {
    title: { en: 'Notifications', mk: 'Известувања' },
    moderationAlwaysDelivered: {
      en: 'Moderation notices are always delivered and cannot be turned off.',
      mk: 'Известувањата од модерацијата секогаш пристигнуваат и не можат да се исклучат.',
    },
    toastsLabel: { en: 'Notification toasts', mk: 'Известувања на екран' },
    toastsOn: { en: 'Show', mk: 'Прикажи' },
    toastsOff: { en: 'Hide', mk: 'Скриј' },
    achievementsLabel: {
      en: 'Achievement notifications',
      mk: 'Известувања за достигнувања',
    },
    achievementsShow: { en: 'Show', mk: 'Прикажи' },
    achievementsHide: { en: 'Hide', mk: 'Скриј' },
  },
  notes: {
    title: { en: 'Calendar notes', mk: 'Белешки во календарот' },
  },
  save: { en: 'Save preferences', mk: 'Зачувај поставки' },
  cancel: { en: 'Close', mk: 'Затвори' },
  saved: { en: 'Preferences saved', mk: 'Поставките се зачувани' },
  loadError: {
    en: "Couldn't load your preferences.",
    mk: 'Не успеа вчитувањето на поставките.',
  },
  saveError: {
    en: "Couldn't save your preferences.",
    mk: 'Не успеа зачувувањето на поставките.',
  },
  retry: { en: 'Try again', mk: 'Обиди се повторно' },
} as const

/** English view for call sites that have not adopted `useStrings` yet. */
export const PREFERENCES_STRINGS = getStrings(
  PREFERENCES_STRINGS_PACK,
  DEFAULT_LOCALE
)
