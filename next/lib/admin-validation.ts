import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import type { RatingLabel } from '@shared/types/ratings.types'
import {
  isValidAchievementId,
  isValidAchievementThreshold,
} from '@shared/utils/achievement-definition.utils'
import {
  isLocalizedRatingLabel,
  isValidRatingLabel,
  trimRatingLabel,
} from '@shared/utils/rating-label.utils'

/** Same rules `POST` and `PATCH /ratings/types` enforce. Each returns an error
 * message, or `null` when the value is valid. */
export const validateRatingTypeId = (id: string): string | null =>
  /^[a-z0-9_]{2,40}$/.test(id) ? null : ADMIN_STRINGS.ratingTypeIdValidation

/** One language of a criterion's name. Empty is allowed — the other language
 * may be the one written; `validateRatingTypeLabels` enforces that at least one
 * is. */
export const validateRatingTypeLabel = (label: string): string | null =>
  label.trim() === '' || isValidRatingLabel(label)
    ? null
    : ADMIN_STRINGS.labelValidation

/** The pair, as the create/rename forms send it: at least one valid language. */
export const validateRatingTypeLabels = (labels: RatingLabel): string | null =>
  isLocalizedRatingLabel(trimRatingLabel(labels))
    ? null
    : ADMIN_STRINGS.labelValidation

/** Same rules `POST` and `PATCH /achievement-definitions` enforce (shared with
 * the API through `achievement-definition.utils`). */
export const validateAchievementId = (id: string): string | null =>
  isValidAchievementId(id) ? null : ADMIN_STRINGS.achievementIdValidation

/** The threshold is typed as text; only plain digits are accepted. */
export const validateAchievementThreshold = (
  threshold: string
): string | null =>
  /^\d+$/.test(threshold.trim()) &&
  isValidAchievementThreshold(Number(threshold.trim()))
    ? null
    : ADMIN_STRINGS.achievementThresholdValidation
