'use client'

import { usePathname } from 'next/navigation'
import { Suspense, useEffect, useSyncExternalStore } from 'react'

/**
 * The route's pathname as a shared client snapshot, for the chrome that wraps
 * every page (`NavProvider`, `NotificationsProvider`).
 *
 * `usePathname()` suspends while the URL is unknown — in the static shell of a
 * route with a reader-supplied segment, which is precisely where the shell is
 * being built. A provider above the page cannot sit inside the boundary that
 * would make that legal, so one leaf reads the hook and publishes it, and the
 * providers above it follow the value instead of suspending.
 */
let currentPathname: string | null = null
const listeners = new Set<() => void>()

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const getSnapshot = () => currentPathname
/** Nothing is known before hydration: the shell has no URL yet. */
const getServerSnapshot = () => null

const publish = (pathname: string) => {
  if (pathname === currentPathname) return
  currentPathname = pathname
  for (const listener of listeners) listener()
}

const PathnamePublisher = () => {
  const pathname = usePathname()

  useEffect(() => publish(pathname), [pathname])

  return null
}

/** Mounted once, by the root layout's providers. */
export const PathnameScope = () => (
  <Suspense fallback={null}>
    <PathnamePublisher />
  </Suspense>
)

/** `null` until the URL is known, which is also what a request-time consumer
 * has to tolerate: the notifications tray filters only once it is. */
export const useCurrentPathname = (): string | null =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
