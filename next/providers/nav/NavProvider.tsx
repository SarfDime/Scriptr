'use client'

import { usePathname } from 'next/navigation'
import {
  createContext,
  type ReactNode,
  use,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react'
import { Box } from '@/components/common/Box'
import { subscribeToStorage } from '@/lib/storage-events'

type NavContextType = {
  /** Desktop only: the docked navbar is hidden. Persisted across visits. */
  collapsed: boolean
  /** Mobile only: the off-canvas navbar is open on the current page. */
  mobileOpen: boolean
  /** Shows the navbar: re-docks it on desktop, slides it in on mobile. */
  openNav: () => void
  /** Hides the navbar: collapses it on desktop, slides it out on mobile. */
  closeNav: () => void
}

const NavContext = createContext<NavContextType | null>(null)

const COLLAPSED_KEY = 'scriptr-nav-collapsed'
// Matches Tailwind's `xl` breakpoint, where the navbar switches from off-canvas
// to docked. It used to be `lg` (64rem): at that width the docked column left
// the content too narrow to lay out two columns comfortably, and the off-canvas
// navbar gives the page the full width until there is genuinely room for both.
const DESKTOP_QUERY = '(min-width: 80rem)'

// The collapsed preference lives in localStorage, exposed through
// useSyncExternalStore so the server render and hydration both use
// `false` and the stored value is applied right after hydration.
const collapsedListeners = new Set<() => void>()
// Fallback for when localStorage is unavailable (private mode, blocked
// storage): the preference then lasts for the current page session only.
let collapsedOverride: boolean | null = null

const subscribeCollapsed = (listener: () => void) => {
  collapsedListeners.add(listener)

  // Another tab's choice: drop the in-memory override so the next read comes
  // from storage, then let React re-render.
  const stopStorage = subscribeToStorage(COLLAPSED_KEY, () => {
    collapsedOverride = null
    listener()
  })

  return () => {
    collapsedListeners.delete(listener)
    stopStorage()
  }
}

const readCollapsed = () => {
  if (collapsedOverride !== null) return collapsedOverride
  try {
    return window.localStorage.getItem(COLLAPSED_KEY) === 'true'
  } catch {
    return false
  }
}

const getServerCollapsed = () => false

const writeCollapsed = (value: boolean) => {
  collapsedOverride = value
  try {
    window.localStorage.setItem(COLLAPSED_KEY, String(value))
  } catch {
    // Storage unavailable: keep the in-memory value only.
  }
  for (const listener of collapsedListeners) listener()
}

const isDesktop = () => window.matchMedia(DESKTOP_QUERY).matches

/**
 * Owns the navbar's visibility and exposes it as data attributes on a
 * `display: contents` wrapper, so the navbar and the page content can both
 * react in CSS (`group-data-[nav-collapsed=true]/nav:` variants, or the
 * `--nav-container-width` override in globals.css) without the navbar itself
 * being a Client Component.
 */
export function NavProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    readCollapsed,
    getServerCollapsed
  )

  // The off-canvas navbar counts as open only on the page it was opened on,
  // so following any link closes it without an effect.
  const [openedOn, setOpenedOn] = useState<string | null>(null)
  const mobileOpen = openedOn === pathname

  useEffect(() => {
    if (!mobileOpen) return undefined

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenedOn(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileOpen])

  const openNav = () => {
    if (isDesktop()) writeCollapsed(false)
    else setOpenedOn(pathname)
  }

  const closeNav = () => {
    if (isDesktop()) writeCollapsed(true)
    else setOpenedOn(null)
  }

  return (
    <NavContext value={{ collapsed, mobileOpen, openNav, closeNav }}>
      <Box
        className='group/nav contents'
        data-nav-collapsed={collapsed}
        data-nav-open={mobileOpen}
      >
        {children}
      </Box>
    </NavContext>
  )
}

export function useNav() {
  const context = use(NavContext)
  if (!context) throw new Error('useNav must be used within a NavProvider')
  return context
}
