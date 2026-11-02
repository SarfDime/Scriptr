import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import {
  isValidAchievementId,
  isValidAchievementThreshold,
} from '@shared/utils/achievement-definition.utils'

/** Same rules `POST` and `PATCH /ratings/types` enforce. Each returns an error
 * message, or `null` when the value is valid. */
export const validateRatingTypeId = (id: string): string | null =>
  /^[a-z0-9_]{2,40}$/.test(id) ? null : ADMIN_STRINGS.ratingTypeIdValidation

export const validateRatingTypeLabel = (label: string): string | null => {
  const length = label.trim().length
  return length >= 2 && length <= 60 ? null : ADMIN_STRINGS.labelValidation
}

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
