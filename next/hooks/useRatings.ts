'use client'

import type {
  MyRating,
  RatingStat,
  RatingTarget,
  RatingType,
} from '@shared/types/ratings.types'
import { useEffect, useState } from 'react'
import {
  getMyRatings,
  getRatingStats,
  getRatingTypes,
} from '@/lib/api/ratings-api'
import { getMyRestriction } from '@/lib/api/restrictions-api'
import { useSession } from '@/providers/SessionProvider'

type CatalogState =
  | { status: 'loading' }
  | { status: 'error' }
  | {
      status: 'loaded'
      types: Array<RatingType>
      stats: Array<RatingStat>
    }

type ViewerState =
  | { userId: string; status: 'error' }
  | {
      userId: string
      status: 'loaded'
      /** `rating_type_id` -> the caller's score */
      scores: Record<string, number>
      restricted: boolean
    }

export type RatingsViewer =
  | { status: 'checking' }
  | { status: 'guest' }
  | { status: 'loading' }
  | { status: 'error' }
  | {
      status: 'member'
      scores: Record<string, number>
      restricted: boolean
    }

const toScoreMap = (ratings: Array<MyRating>) =>
  Object.fromEntries(ratings.map((r) => [r.rating_type_id, r.score]))

/** Loads the public criteria and aggregates. Returns a cancel function. */
function fetchCatalog(
  { targetType, targetId }: RatingTarget,
  onState: (state: CatalogState) => void
) {
  let cancelled = false

  Promise.all([
    getRatingTypes(targetType),
    getRatingStats({ targetType, targetId }),
  ])
    .then(([types, stats]) => {
      if (!cancelled) onState({ status: 'loaded', types, stats })
    })
    .catch(() => {
      if (!cancelled) onState({ status: 'error' })
    })

  return () => {
    cancelled = true
  }
}

/** Loads the signed-in viewer's scores and restriction. Returns a cancel
 * function. The restriction lookup is a convenience (it lets the UI explain
 * itself up front): if it fails, assume unrestricted. The API still enforces
 * it, and a 403 on save is handled by useProtectedAction. */
function fetchViewer(
  userId: string,
  target: RatingTarget,
  onState: (state: ViewerState) => void
) {
  let cancelled = false

  Promise.all([getMyRatings(target), getMyRestriction().catch(() => null)])
    .then(([mine, restriction]) => {
      if (cancelled) return
      onState({
        userId,
        status: 'loaded',
        scores: toScoreMap(mine),
        restricted: restriction !== null,
      })
    })
    .catch(() => {
      if (!cancelled) onState({ userId, status: 'error' })
    })

  return () => {
    cancelled = true
  }
}

/** Derived, so signing out or switching accounts never shows stale scores. */
function getViewer(
  sessionStatus: 'loading' | 'authenticated' | 'unauthenticated',
  userId: string | null,
  viewerState: ViewerState | null
): RatingsViewer {
  if (sessionStatus === 'loading') return { status: 'checking' }
  if (userId === null) return { status: 'guest' }
  if (viewerState?.userId !== userId) return { status: 'loading' }
  if (viewerState.status === 'error') return { status: 'error' }
  return {
    status: 'member',
    scores: viewerState.scores,
    restricted: viewerState.restricted,
  }
}

/**
 * Loads a professor's or subject's rating criteria and aggregates, plus the
 * signed-in viewer's own scores and restriction status, in the browser after
 * mount. The pages stay static: the criteria and stats are public, but the
 * viewer's data needs their session cookie.
 *
 * State only changes inside promise callbacks or event handlers, never
 * synchronously in an effect (Biome's useReactCompiler lint). There is no
 * reset when the target changes: render under `key={targetId}` so a new
 * entity remounts with fresh state.
 */
export function useRatings(target: RatingTarget) {
  const { targetType, targetId } = target
  const { session } = useSession()
  const userId = session.status === 'authenticated' ? session.user.id : null

  const [catalog, setCatalog] = useState<CatalogState>({ status: 'loading' })
  const [viewerState, setViewerState] = useState<ViewerState | null>(null)

  useEffect(
    () => fetchCatalog({ targetType, targetId }, setCatalog),
    [targetType, targetId]
  )

  useEffect(() => {
    if (!userId) return
    return fetchViewer(userId, { targetType, targetId }, setViewerState)
  }, [userId, targetType, targetId])

  const viewer = getViewer(session.status, userId, viewerState)

  const retryCatalog = () => {
    setCatalog({ status: 'loading' })
    fetchCatalog({ targetType, targetId }, setCatalog)
  }

  const retryViewer = () => {
    if (!userId) return
    setViewerState(null)
    fetchViewer(userId, { targetType, targetId }, setViewerState)
  }

  /** The averages are computed by the API, so re-read them after a change.
   * A failed refresh keeps the previous numbers rather than erroring. */
  const refreshStats = () => {
    getRatingStats({ targetType, targetId })
      .then((stats) => {
        setCatalog((prev) =>
          prev.status === 'loaded' ? { ...prev, stats } : prev
        )
      })
      .catch(() => {
        // Keep showing the previous numbers.
      })
  }

  const setScore = (ratingTypeId: string, score: number | null) => {
    setViewerState((prev) => {
      if (prev?.status !== 'loaded') return prev
      const scores = { ...prev.scores }
      if (score === null) delete scores[ratingTypeId]
      else scores[ratingTypeId] = score
      return { ...prev, scores }
    })
    refreshStats()
  }

  return { catalog, viewer, retryCatalog, retryViewer, setScore }
}
