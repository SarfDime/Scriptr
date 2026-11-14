import { DEFAULT_LOCALE } from '../config/localization-constants'
import type { LocalizedText } from '../types/localization.types'
import { getStrings } from '../utils/localized-strings'

/** User-facing copy for the professor and subject ratings UI. Entries that
 * depend on a value (labels, counts, scores) are small functions so wording
 * and pluralisation stay here instead of leaking into components. The
 * restricted-account message is shared: `UI_STRINGS.general.restrictedAction`.
 *
 * `{ en, mk }` entries are the source of truth; `RATING_STRINGS` at the bottom
 * is the English view for call sites that have not adopted `useStrings`. */
export const RATING_STRINGS_PACK = {
  title: { en: 'Ratings', mk: 'Оценки' },
  loading: { en: 'Loading ratings…', mk: 'Се вчитуваат оценките…' },
  loadError: {
    en: 'Could not load ratings.',
    mk: 'Не успеа вчитувањето на оценките.',
  },
  retry: { en: 'Try again', mk: 'Обиди се повторно' },
  empty: {
    en: 'There is nothing to rate here yet.',
    mk: 'Сè уште нема што да се оцени.',
  },
  noRatingsYet: { en: 'No ratings yet', mk: 'Сè уште нема оценки' },
  summary: (average: number, count: number): LocalizedText => ({
    en: `${average.toFixed(1)} · ${count === 1 ? '1 rating' : `${count} ratings`}`,
    mk: `${average.toFixed(1)} · ${count === 1 ? '1 оценка' : `${count} оценки`}`,
  }),
  groupLabel: (criterion: string): LocalizedText => ({
    en: `Your rating for ${criterion}`,
    mk: `Твоја оценка за ${criterion}`,
  }),
  scoreOption: (score: number): LocalizedText => ({
    en: `${score} out of 5`,
    mk: `${score} од 5`,
  }),
  signInPrompt: { en: 'Sign in to rate.', mk: 'Најави се за да оцениш.' },
  signIn: { en: 'Sign in', mk: 'Најави се' },
  checkingAccess: {
    en: 'Checking your account…',
    mk: 'Се проверува сметката…',
  },
  loadMineError: {
    en: 'Could not load your ratings.',
    mk: 'Не успеа вчитувањето на твоите оценки.',
  },
  saving: { en: 'Saving…', mk: 'Се зачувува…' },
  removing: { en: 'Removing…', mk: 'Се отстранува…' },
  remove: { en: 'Clear', mk: 'Отстрани' },
  removeAria: (criterion: string): LocalizedText => ({
    en: `Remove my ${criterion} rating`,
    mk: `Отстрани ја мојата оценка за ${criterion}`,
  }),
  saved: (criterion: string): LocalizedText => ({
    en: `${criterion} rating saved`,
    mk: `Оценката за ${criterion} е зачувана`,
  }),
  removed: (criterion: string): LocalizedText => ({
    en: `${criterion} rating removed`,
    mk: `Оценката за ${criterion} е отстранета`,
  }),
  saveFailed: (criterion: string): LocalizedText => ({
    en: `Couldn’t save your ${criterion} rating. Please try again.`,
    mk: `Не успеа зачувувањето на оценката за ${criterion}. Обиди се повторно.`,
  }),
  removeFailed: (criterion: string): LocalizedText => ({
    en: `Couldn’t remove your ${criterion} rating. Please try again.`,
    mk: `Не успеа отстранувањето на оценката за ${criterion}. Обиди се повторно.`,
  }),
} as const

/** English view for call sites that have not adopted `useStrings` yet. */
export const RATING_STRINGS = getStrings(RATING_STRINGS_PACK, DEFAULT_LOCALE)
