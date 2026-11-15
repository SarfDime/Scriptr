import type { RatingTargetType } from '@shared/config/api'
import { apiRoutes } from '@shared/config/api-routes'
import { RATING_CACHE_TAGS } from '@shared/config/cache-tags'
import type {
  MyRating,
  RatingLabel,
  RatingStat,
  RatingTarget,
  RatingType,
  RatingTypeMutationResponse,
  RatingUpsertResponse,
} from '@shared/types/ratings.types'
import {
  type ApiFetchOptions,
  apiFetchRequired,
  cachedPublicRead,
} from './next-api'

/** Ratings are read in the browser, after mount, so the professor and subject
 * pages stay static. The viewer's own scores are never cached. */
const NO_STORE = { cache: 'no-store' } as const

/**
 * Versions the cached criteria lists. It rides along as a query parameter, so
 * bumping it changes the fetch URL and every cached body is bypassed: a
 * criterion used to carry one English `label` and now carries `labels` per
 * language, and an entry from before that has no name to resolve. Raised to 2
 * with `20261115013000_rating_type_labels.sql`.
 */
const RATING_TYPES_PAYLOAD_VERSION = 2

const ratingTypesPath = (targetType: RatingTargetType) =>
  `${apiRoutes.ratings.types(
    targetType
  )}&ratingTypesVersion=${RATING_TYPES_PAYLOAD_VERSION}` as const

/** The criteria and the aggregates are the same for every viewer, so a
 * server-side read is a tagged Data Cache entry. The browser always reads them
 * fresh: `useRatings` re-reads the averages straight after a rating changes,
 * and a cached body would show the previous numbers. */
const ratingRead = (tags: Array<string>): ApiFetchOptions =>
  typeof window === 'undefined' ? cachedPublicRead(tags) : NO_STORE

const statsTag = ({ targetType, targetId }: RatingTarget) =>
  targetType === 'professor'
    ? RATING_CACHE_TAGS.professor(targetId)
    : RATING_CACHE_TAGS.subject(targetId)

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
    ratingTypesPath(targetType),
    ratingRead([RATING_CACHE_TAGS.types()])
  )

/** Both target types in one list, for the admin page. `rating_types` is
 * publicly readable and the endpoint takes no session, so nothing is
 * personalized: the server-side read is a tagged Data Cache entry refreshed
 * only when a rating type changes. */
export const getAllRatingTypes = async () => {
  const options = ratingRead([RATING_CACHE_TAGS.types()])
  const [professorTypes, subjectTypes] = await Promise.all([
    apiFetchRequired<Array<RatingType>>(ratingTypesPath('professor'), options),
    apiFetchRequired<Array<RatingType>>(ratingTypesPath('subject'), options),
  ])
  return [...professorTypes, ...subjectTypes]
}

export const createRatingType = (input: {
  id: string
  target_type: RatingTargetType
  labels: RatingLabel
}) =>
  apiFetchRequired<RatingTypeMutationResponse>(
    apiRoutes.ratings.types('professor'),
    {
      method: 'POST',
      body: input,
    }
  )

export const renameRatingType = (id: string, labels: RatingLabel) =>
  apiFetchRequired<RatingTypeMutationResponse>(
    apiRoutes.ratings.typesById(id),
    {
      method: 'PATCH',
      body: { labels },
    }
  )

export const removeRatingType = (id: string) =>
  apiFetchRequired<{ success: true; message: string }>(
    apiRoutes.ratings.typesById(id),
    { method: 'DELETE' }
  )

/** Public. Only criteria with at least one rating appear. */
export const getRatingStats = (target: RatingTarget) =>
  apiFetchRequired<Array<RatingStat>>(
    ratingPaths(target).stats,
    ratingRead([statsTag(target)])
  )

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
