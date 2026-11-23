'use client'

import {
  getSiteSlugFromHost,
  getSiteSlugFromPath,
} from '@shared/utils/site-paths'
import { useSyncExternalStore } from 'react'
import { studySiteHost } from '@/lib/study-origin'
import { useCurrentPathname } from '@/providers/nav/pathname-scope'

/**
 * The browser's host, read through `useSyncExternalStore` so hydration starts
 * from the server's empty value and settles on the real host afterwards — the
 * host cannot change without a page load, so there is nothing to subscribe to.
 */
const subscribeToHost = () => () => {
  // The host cannot change without a page load, so there is nothing to watch.
}
const readBrowserHost = () => window.location.host
const readServerHost = () => ''

/**
 * The study site the reader is on: from the catalog path (`/study/lbe/…`) or
 * from the host serving it (`lbe.scriptr.uk`), whichever names it. `null` on the
 * catalog itself.
 */
export const useCurrentStudySiteSlug = (): string | null => {
  const pathname = useCurrentPathname()
  const browserHost = useSyncExternalStore(
    subscribeToHost,
    readBrowserHost,
    readServerHost
  )

  return (
    getSiteSlugFromPath(pathname ?? '') ??
    getSiteSlugFromHost(browserHost, studySiteHost())
  )
}
