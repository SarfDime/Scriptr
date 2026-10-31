'use client'

import {
  createContext,
  useContext,
  useState,
  useSyncExternalStore,
} from 'react'
import {
  hasCompletedOnboarding,
  hasDismissedOnboarding,
  subscribeToGuestAcademicData,
} from '@/lib/onboarding-storage'
import { accountHasAcademicData } from '@/lib/profile-sync'
import { useLoading } from '@/providers/loading/LoadingProvider'
import { useSession } from '@/providers/SessionProvider'
import type { OnboardingCatalog } from '@/types/onboarding.types'
import { useMyProfile } from '../ProfileProvider'

type OnboardingContextValue = {
  isOpen: boolean
  open: () => void
  close: () => void
  catalog: OnboardingCatalog
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

const getServerFlag = () => false

export const OnboardingProvider = ({
  children,
  catalog,
}: {
  children: React.ReactNode
  catalog: OnboardingCatalog
}) => {
  const { session } = useSession()
  const profile = useMyProfile()

  // localStorage isn't safe to read during the initial render (it would
  // mismatch the server-rendered markup), so useSyncExternalStore is used
  // here instead of an effect: it returns getServerFlag's value during
  // SSR/hydration and the real localStorage value on every render after,
  // with no manual "read once after mount" effect required.
  const completed = useSyncExternalStore(
    subscribeToGuestAcademicData,
    hasCompletedOnboarding,
    getServerFlag
  )
  const dismissed = useSyncExternalStore(
    subscribeToGuestAcademicData,
    hasDismissedOnboarding,
    getServerFlag
  )

  // Whether the modal should auto-open is fully derived at render from
  // session/profile (already reactive values — no effect needed to
  // "notice" they changed) and the two localStorage flags above. This
  // replaces the previous effect that copied those into state.
  const accountAlreadySetUp =
    session.status === 'authenticated' &&
    profile.status === 'loaded' &&
    accountHasAcademicData(profile.profile)

  // useMyProfile starts as 'idle' (before its fetch effect fires) and only
  // then moves to 'loading', so "still waiting" has to cover both — a
  // check for 'loading' alone leaves a one-tick window where an
  // authenticated user with existing data reads as "decided: open".
  // 'error' is deliberately not waiting: fall through and show the wizard.
  const stillDeciding =
    session.status === 'loading' ||
    (session.status === 'authenticated' &&
      (profile.status === 'idle' || profile.status === 'loading'))

  // The setup wizard is a modal dialog, and so is the loading screen. A modal
  // dialog paints in the browser's top layer, above everything in normal flow
  // whatever its z-index, and the one shown last wins — so a wizard that opened
  // while loading would sit on top of the loader. Wait for the loader instead:
  // there is nothing to set up during a splash or an upload anyway.
  const { isOverlayVisible } = useLoading()

  const autoShouldOpen =
    !isOverlayVisible &&
    !stillDeciding &&
    !accountAlreadySetUp &&
    !completed &&
    !dismissed

  // The person can always override the auto decision by explicitly
  // opening or closing the modal (e.g. the "Resume setup" notification
  // action, or clicking out of the dialog); once they do, that choice
  // wins for the rest of this session regardless of how session/profile
  // data continues to change.
  const [manualOverride, setManualOverride] = useState<boolean | null>(null)
  const isOpen = manualOverride ?? autoShouldOpen

  const open = () => setManualOverride(true)
  const close = () => setManualOverride(false)

  return (
    <OnboardingContext.Provider value={{ isOpen, open, close, catalog }}>
      {children}
    </OnboardingContext.Provider>
  )
}

export const useOnboarding = () => {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider')
  }
  return context
}
