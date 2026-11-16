'use client'

import type { MyProfileResponse } from '@shared/types/profile.types'
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'
import { getMyProfile } from '@/lib/api/profile-api'
import { useUIStrings } from '@/providers/locale/use-strings'
import { useLoading } from './loading/LoadingProvider'
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

/** The global loader's key for the boot, so the veil covers the session and
 * profile reads together. */
const BOOT_TASK = 'profile'

/** Module-level, like SessionProvider's fetchSession — the effect below
 * calls it without pulling a `refresh` closure into its dependency
 * array, since React guarantees setFetchState's identity is stable. */
async function fetchProfile(
  setFetchState: (state: ProfileFetchState) => void,
  loadError: string
) {
  setFetchState({ status: 'loading' })
  try {
    const profile = await getMyProfile()
    setFetchState({ status: 'loaded', profile })
  } catch {
    setFetchState({
      status: 'error',
      message: loadError,
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
 * context, so the navbar, the profile pages and the notifications provider
 * read one request between them instead of one each.
 * Must sit inside SessionProvider (needs session.status) and wrap anything that
 * calls useMyProfile — the navbar, the profile pages and the notifications
 * provider.
 *
 * 'idle' (not authenticated, nothing to fetch) is derived from
 * session.status at render rather than set via the effect: an early-return
 * guard clause that also calls setState trips the React Compiler lint, and
 * there is nothing to fetch without a session. The 'loading' transition
 * inside the effect is deferred through Promise.resolve().then(), so
 * re-authenticating as a different user doesn't flash the *previous* user's
 * stale profile while the new fetch is in flight.
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const ui = useUIStrings()
  const { loadError } = ui.profile
  const { session } = useSession()
  const { startTask, finishTask } = useLoading()
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
    }, loadError)

    return () => {
      cancelled = true
    }
  }, [session.status, loadError])

  const profile: MyProfileState =
    session.status === 'authenticated' ? fetchState : { status: 'idle' }

  // What the app cannot render without is the profile, and it cannot start
  // reading it until the session resolves, so the loader is held for both: the
  // theme task alone finishes long before either, which let the veil start
  // leaving and then come back — and until then the navbar had no "your
  // studies" to show. `reload` (after an edit) keeps `loaded`, so it never
  // brings the veil back.
  const isBooting = session.status === 'loading' || profile.status === 'loading'

  useEffect(() => {
    if (!isBooting) return undefined

    startTask(BOOT_TASK)
    return () => finishTask(BOOT_TASK)
  }, [isBooting, startTask, finishTask])

  const refresh = () => fetchProfile(setFetchState, loadError)
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
