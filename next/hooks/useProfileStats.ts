'use client'

import type { ProfileStats } from '@shared/types/profile.types'
import { useEffect, useState } from 'react'
import { getProfileStats } from '@/lib/api/profile-api'

type ProfileStatsFetchState =
  | { status: 'loading' }
  | { status: 'loaded'; stats: ProfileStats }
  | { status: 'error' }

type ProfileStatsState = { status: 'idle' } | ProfileStatsFetchState

/**
 * Fetches GET /profiles/:id/stats for any user id — public endpoint, no
 * auth required. Takes a plain string (or null while the id isn't known
 * yet, e.g. before useMyProfile resolves) rather than a profile object,
 * so the dependency array is a stable primitive and this is reusable
 * anywhere a stats card needs a specific user's numbers, not just the
 * viewer's own profile page.
 *
 * 'idle' is derived at the return statement, not set via the effect: an
 * early-return guard clause that also calls setState
 * (`if (!userId) { setState(...); return }`) is exactly the pattern
 * Biome's useReactCompiler lint (error in this repo's biome.json) flags
 * as "derive during render instead" — there's nothing to fetch when
 * there's no id, so the effect just does nothing and the hook returns
 * 'idle' directly rather than ever storing it as state. The 'loading'
 * transition is deferred through Promise.resolve().then(), the same
 * idiom useMyProfile.ts already uses, so switching from one userId to
 * another doesn't flash the *previous* id's stale stats while the new
 * fetch is in flight — fetchState only changes once the new fetch
 * actually starts or resolves, never synchronously inside the effect.
 */
export function useProfileStats(userId: string | null) {
  const [fetchState, setFetchState] = useState<ProfileStatsFetchState>({
    status: 'loading',
  })

  useEffect(() => {
    if (!userId) return

    let cancelled = false
    Promise.resolve().then(() => {
      if (!cancelled) setFetchState({ status: 'loading' })
    })

    getProfileStats(userId)
      .then((stats) => {
        if (!cancelled) setFetchState({ status: 'loaded', stats })
      })
      .catch(() => {
        if (!cancelled) setFetchState({ status: 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  const state: ProfileStatsState = userId ? fetchState : { status: 'idle' }
  return state
}
