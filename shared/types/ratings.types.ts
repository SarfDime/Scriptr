import type { RatingTargetType } from '../config/api'
import type { Tables } from './database.types'

/** A rating criterion. `GET /api/ratings/types` returns the full row. */
export type RatingType = Tables<'rating_types'>

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

/** The rated entity: its target kind and its database id (never a slug). */
export type RatingTarget = {
  targetType: RatingTargetType
  targetId: string
}
