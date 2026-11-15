import { LOCALES, type LocaleId } from '../config/localization-constants'
import type { RatingLabel } from '../types/ratings.types'
import { resolveLocalizedText } from './localized-strings'

/** The length one language's criterion name must have — enforced by the admin
 *  form, `POST`/`PATCH /ratings/types`, and the `rating_types.labels` check. */
export const RATING_LABEL_LENGTH = { min: 2, max: 60 } as const

/** One language's label: a string within the length rule once trimmed. */
export const isValidRatingLabel = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.trim().length >= RATING_LABEL_LENGTH.min &&
  value.trim().length <= RATING_LABEL_LENGTH.max

/**
 * What `POST`/`PATCH /ratings/types` accepts for `labels`: an object keyed by
 * language, every language present a valid label, and at least one written.
 * Anything else — a bare string, an unknown key, an empty object — is rejected
 * rather than guessed at, so a stale client cannot silently write a name no
 * reader resolves.
 */
export const isLocalizedRatingLabel = (
  value: unknown
): value is RatingLabel => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }

  const entries = Object.entries(value)
  return (
    entries.length > 0 &&
    entries.every(
      ([language, label]) =>
        LOCALES.includes(language as LocaleId) && isValidRatingLabel(label)
    )
  )
}

/** The map to store: every language trimmed, keys the caller did not send left
 *  out. Call it on an `isLocalizedRatingLabel` value. */
export const trimRatingLabel = (labels: RatingLabel): RatingLabel => {
  const trimmed: RatingLabel = {}
  for (const locale of LOCALES) {
    const label = labels[locale]
    if (label !== undefined) trimmed[locale] = label.trim()
  }
  return trimmed
}

/** The criterion's name in one language. `''` when the row carries none, so a
 *  half-filled map renders an empty label rather than throwing. */
export const resolveRatingLabel = (
  labels: RatingLabel | null | undefined,
  locale: LocaleId
): string => resolveLocalizedText(labels ?? {}, locale)
