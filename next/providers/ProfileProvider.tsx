'use client'

import { UI_STRINGS } from '@shared/config/strings'
import type { MyProfileResponse } from '@shared/types/profile.types'
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'
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
  reload: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

/** Module-level, like SessionProvider's fetchSession — the effect below
 * calls it without pulling a `refresh` closure into its dependency
 * array, since React guarantees setFetchState's identity is stable. */
async function fetchProfile(setFetchState: (state: ProfileFetchState) => void) {
  setFetchState({ status: 'loading' })
  try {
    const profile = await getMyProfile()
    setFetchState({ status: 'loaded', profile })
  } catch {
    setFetchState({
      status: 'error',
      message: UI_STRINGS.profile.loadError,
    })
  }
}

/** Re-fetches without the 'loading' transition, so a screen showing the
 * profile (e.g. after an edit) updates in place instead of flashing its
 * loading state. A failed re-fetch keeps whatever is already showing. */
async function reloadProfile(
  setFetchState: (state: ProfileFetchState) => void
) {
  try {
    const profile = await getMyProfile()
    setFetchState({ status: 'loaded', profile })
  } catch {
    // Keep the profile that is already on screen.
  }
}

/**
 * Fetches GET /profiles/me exactly once per session and shares it via
 * context. Previously (useMyProfile as a plain fetch-on-mount hook) each
 * call site ran its own independent fetch — Navbar, the profile page and the
 * notifications provider were all separately calling GET /me, multiplying the
 * real request count by however many of them happened to be mounted at once.
 * Must sit inside SessionProvider (needs session.status) and wrap anything that
 * calls useMyProfile — the navbar, the profile pages and the notifications
 * provider.
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
  const reload = () => reloadProfile(setFetchState)

  return (
    <ProfileContext.Provider value={{ profile, refresh, reload }}>
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

export function useMyProfileActions() {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useMyProfileActions must be used within a ProfileProvider')
  }
  return { refresh: context.refresh, reload: context.reload }
}
