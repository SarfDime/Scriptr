import type { RatingTargetType } from '../config/api'
import type { LocaleId } from '../config/localization-constants'
import type { Tables } from './database.types'

/** A criterion's name per language — `rating_types.labels` in Postgres, which
 *  is `jsonb` and already narrowed by the API's write validation
 *  (`isLocalizedRatingLabel`). At least one language is filled. */
export type RatingLabel = Partial<Record<LocaleId, string>>

/** A rating criterion. `GET /api/ratings/types` returns the full row.
 *
 * `labels` is hand-narrowed from the generated `jsonb`: it is the column the
 * API validates on write and the check constraint enforces, so the row read
 * back is always this shape (the same reason `ScriptSummary` hand-writes
 * `title`). */
export type RatingType = Omit<Tables<'rating_types'>, 'labels'> & {
  labels: RatingLabel
}

/** One entry of `GET /api/ratings/{professor,subject}/:id/stats`. The route
 * only returns criteria that have at least one rating. */
export type RatingStat = {
  rating_type_id: string
  average: number
  count: number
}

/** The caller's own rating for one criterion (`.../my-ratings` rows carry more
 * columns; the UI only needs these two). */
export type MyRating = Pick<
  Tables<'professor_ratings'>,
  'rating_type_id' | 'score'
>

/** `POST /api/ratings/{professor,subject}/:id` */
export type RatingUpsertResponse = { success: true; rating: MyRating }

export type RatingTypeMutationResponse = {
  success: true
  rating_type: RatingType
}

/** The rated entity: its target kind and its database id (never a slug). */
export type RatingTarget = {
  targetType: RatingTargetType
  targetId: string
}
