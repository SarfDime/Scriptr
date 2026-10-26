import type { RatingTargetType } from '@shared/config/api'
import { apiRoutes } from '@shared/config/api-routes'
import type {
  MyRating,
  RatingStat,
  RatingTarget,
  RatingType,
  RatingUpsertResponse,
} from '@shared/types/ratings.types'
import { apiFetchRequired } from './next-api'

/** Ratings are read in the browser, after mount, so the professor and subject
 * pages stay static. Never cache: averages change with every rating. */
const NO_STORE = { cache: 'no-store' } as const

const ratingPaths = ({ targetType, targetId }: RatingTarget) =>
  targetType === 'professor'
    ? {
        stats: apiRoutes.ratings.professorStatsByProfessorId(targetId),
        mine: apiRoutes.ratings.professorMyRatingsByProfessorId(targetId),
        rate: apiRoutes.ratings.professorByProfessorId(targetId),
        remove: (ratingTypeId: string) =>
          apiRoutes.ratings.professorByProfessorIdAndRatingTypeId(
            targetId,
            ratingTypeId
          ),
      }
    : {
        stats: apiRoutes.ratings.subjectStatsBySubjectId(targetId),
        mine: apiRoutes.ratings.subjectMyRatingsBySubjectId(targetId),
        rate: apiRoutes.ratings.subjectBySubjectId(targetId),
        remove: (ratingTypeId: string) =>
          apiRoutes.ratings.subjectBySubjectIdAndRatingTypeId(
            targetId,
            ratingTypeId
          ),
      }

/** Public. The criteria are data (`rating_types`), never hardcoded. */
export const getRatingTypes = (targetType: RatingTargetType) =>
  apiFetchRequired<Array<RatingType>>(
    apiRoutes.ratings.types(targetType),
    NO_STORE
  )

/** Public. Only criteria with at least one rating appear. */
export const getRatingStats = (target: RatingTarget) =>
  apiFetchRequired<Array<RatingStat>>(ratingPaths(target).stats, NO_STORE)

/** Requires a session. */
export const getMyRatings = (target: RatingTarget) =>
  apiFetchRequired<Array<MyRating>>(ratingPaths(target).mine, NO_STORE)

/** Create or change the caller's score for one criterion (the route upserts).
 * Restriction-checked (`is_restricted()` in RLS → 403), so callers should run
 * this through useProtectedAction. */
export const postRating = (
  target: RatingTarget,
  ratingTypeId: string,
  score: number
) =>
  apiFetchRequired<RatingUpsertResponse>(ratingPaths(target).rate, {
    method: 'POST',
    body: { rating_type_id: ratingTypeId, score },
  })

/** Never restriction-checked, so don't wrap it in useProtectedAction. */
export const deleteRating = (target: RatingTarget, ratingTypeId: string) =>
  apiFetchRequired<{ success: true }>(
    ratingPaths(target).remove(ratingTypeId),
    {
      method: 'DELETE',
    }
  )
