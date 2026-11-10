'use client'

import { usePathname } from 'next/navigation'
import {
  createContext,
  useContext,
  useEffect,
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
  /** Null until the client fetch below resolves. */
  catalog: OnboardingCatalog | null
  catalogError: boolean
  retryCatalog: () => void
  /** Marks the catalog as needed now; the fetch effect below starts then. */
  requestCatalog: () => void
}

/** What display-only consumers render before the catalog arrives. It is never
 * used by the wizard or the academics editor, which must see the real catalog
 * before they seed their state from it. */
export const EMPTY_ONBOARDING_CATALOG: OnboardingCatalog = {
  universities: [],
  faculties: [],
  studies: [],
  subjects: [],
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

const getServerFlag = () => false

export const OnboardingProvider = ({
  children,
}: {
  children: React.ReactNode
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

  // A study site has its own setup page (`/study/[siteSlug]/academic-setup`),
  // created per study and written per study, so the global wizard must not open
  // over it — two setup flows at once is what this used to do. It keeps serving
  // the catalog and the pages outside the study tree until it is retired.
  const pathname = usePathname()
  const isStudySite = pathname?.startsWith('/study/') ?? false

  const autoShouldOpen =
    !isStudySite &&
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

  // The catalog is fetched once on the client, not with the page. The root
  // layout used to read it on the server and hand it to this provider, which
  // copied it into the RSC payload of every page; the route behind this fetch is
  // static and cacheable, so repeat visits do not pay for it again.
  const [catalog, setCatalog] = useState<OnboardingCatalog | null>(null)
  const [catalogError, setCatalogError] = useState(false)
  const [catalogRequested, setCatalogRequested] = useState(false)
  // Bumped by a retry. State is only set from the fetch callbacks, not when the
  // effect starts, so a failed attempt cannot cascade into a re-render loop.
  const [catalogAttempt, setCatalogAttempt] = useState(0)

  useEffect(() => {
    // The wizard opening is itself a demand signal.
    if (!isOpen && !catalogRequested) return
    if (catalog) return

    let cancelled = false

    const loadCatalog = async () => {
      try {
        // A retry busts the browser's copy of a failed response; the route is
        // static and ignores the parameter.
        const response = await fetch(
          catalogAttempt > 0
            ? `/api/onboarding-catalog?attempt=${catalogAttempt}`
            : '/api/onboarding-catalog'
        )
        if (!response.ok) throw new Error(`Status ${response.status}`)

        const data = (await response.json()) as OnboardingCatalog
        if (!cancelled) {
          setCatalog(data)
          setCatalogError(false)
        }
      } catch {
        if (!cancelled) setCatalogError(true)
      }
    }

    loadCatalog()

    return () => {
      cancelled = true
    }
  }, [isOpen, catalogRequested, catalog, catalogAttempt])

  const retryCatalog = () => {
    setCatalogError(false)
    setCatalogAttempt((attempt) => attempt + 1)
  }

  return (
    <OnboardingContext.Provider
      value={{
        isOpen,
        open,
        close,
        catalog,
        catalogError,
        retryCatalog,
        requestCatalog: () => setCatalogRequested(true),
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

/**
 * The catalog is fetched on demand rather than with the page. A component that
 * renders catalog data passes whether it needs it now; the first true value
 * starts the fetch for the whole app, and the value is null until it arrives.
 */
export const useOnboardingCatalog = (
  enabled = true
): OnboardingCatalog | null => {
  const { catalog, requestCatalog } = useOnboarding()

  useEffect(() => {
    if (enabled) requestCatalog()
  }, [enabled, requestCatalog])

  return catalog
}

export const useOnboarding = () => {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider')
  }
  return context
}
