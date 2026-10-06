'use client'

import type { MyProfileResponse } from '@shared/types/profile.types'
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'
import { ApiError } from '@/lib/api/next-api'
import { getMyProfile } from '@/lib/api/profile-api'
import { useSession } from './SessionProvider'

type ProfileFetchState =
  | { status: 'loading' }
  | { status: 'loaded'; profile: MyProfileResponse }
  | { status: 'error'; message: string }

type MyProfileState = { status: 'idle' } | ProfileFetchState

type ProfileContextValue = {
  profile: MyProfileState
  refresh: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

function extractErrorMessage(error: unknown): string {
  return error instanceof ApiError || error instanceof Error
    ? error.message
    : 'Something went wrong'
}

/** Module-level, like SessionProvider's fetchSession — the effect below
 * calls it without pulling a `refresh` closure into its dependency
 * array, since React guarantees setFetchState's identity is stable. */
async function fetchProfile(setFetchState: (state: ProfileFetchState) => void) {
  try {
    const profile = await getMyProfile()
    setFetchState({ status: 'loaded', profile })
  } catch (error) {
    setFetchState({ status: 'error', message: extractErrorMessage(error) })
  }
}

/**
 * Fetches GET /profiles/me exactly once per session and shares it via
 * context. Previously (useMyProfile as a plain fetch-on-mount hook) each
 * call site ran its own independent fetch — Navbar, the profile page,
 * OnboardingProvider, and useAccountOnboardingSync were all separately
 * calling GET /me, multiplying the real request count by however many of
 * them happened to be mounted at once. Must sit inside SessionProvider
 * (needs session.status) and wrap anything that calls useMyProfile —
 * currently OnboardingProvider and, through it, OnboardingModal.
 *
 * 'idle' (not authenticated, nothing to fetch) is derived from
 * session.status at render rather than set via the effect — see
 * useProfileStats.ts's comment for why an early-return guard clause that
 * also calls setState trips useReactCompiler. The 'loading' transition
 * inside the effect is deferred through Promise.resolve().then(), same
 * idiom as the original useMyProfile.ts, so re-authenticating as a
 * different user doesn't flash the *previous* user's stale profile while
 * the new fetch is in flight.
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session } = useSession()
  const [fetchState, setFetchState] = useState<ProfileFetchState>({
    status: 'loading',
  })

  useEffect(() => {
    if (session.status !== 'authenticated') return

    let cancelled = false
    Promise.resolve().then(() => {
      if (!cancelled) setFetchState({ status: 'loading' })
    })

    fetchProfile((next) => {
      if (!cancelled) setFetchState(next)
    })

    return () => {
      cancelled = true
    }
  }, [session.status])

  const profile: MyProfileState =
    session.status === 'authenticated' ? fetchState : { status: 'idle' }

  const refresh = () => fetchProfile(setFetchState)

  return (
    <ProfileContext.Provider value={{ profile, refresh }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useMyProfile() {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useMyProfile must be used within a ProfileProvider')
  }
  return context.profile
}
