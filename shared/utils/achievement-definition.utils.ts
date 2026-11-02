/**
 * Rules for `achievement_definitions` rows. They mirror the table's CHECK
 * constraints, and the API and the admin form both use them so the two cannot
 * drift. Metric and rarity are validated against the lists in
 * shared/config/achievements.ts, which are stricter than the DB (it only
 * checks metric length and the rarity set).
 *
 * Title and description are not edited through the API any more — they come
 * from `ACHIEVEMENT_COPY` — but the DB still caps them, so their limits stay
 * here for the tests that keep the catalogue inside those caps.
 */
export const ACHIEVEMENT_ID_PATTERN = /^[a-z0-9_]{2,60}$/
export const ACHIEVEMENT_TITLE_MIN_LENGTH = 2
export const ACHIEVEMENT_TITLE_MAX_LENGTH = 100
export const ACHIEVEMENT_DESCRIPTION_MAX_LENGTH = 500
/** `threshold` is a Postgres integer. */
export const ACHIEVEMENT_THRESHOLD_MAX = 2_147_483_647

export const isValidAchievementId = (value: unknown): value is string =>
  typeof value === 'string' && ACHIEVEMENT_ID_PATTERN.test(value)

export const isValidAchievementThreshold = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value > 0 &&
  value <= ACHIEVEMENT_THRESHOLD_MAX
