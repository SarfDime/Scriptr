'use client'

import { createContext, type ReactNode, use, useSyncExternalStore } from 'react'

const PrerenderNowContext = createContext<number | null>(null)

/**
 * The browser's clock, read the first time a label subscribes rather than
 * during a render: a render-time `Date.now()` fails the prerender and cannot be
 * memoised. Every relative label on the page shares the one instant, so two
 * labels from the same render cannot disagree.
 */
let browserNow: number | null = null
const listeners = new Set<() => void>()

const subscribeToClock = (listener: () => void) => {
  listeners.add(listener)

  // Every mount re-reads the clock, so a page kept open does not label new
  // content against the instant it was first hydrated at.
  const previous = browserNow
  browserNow = Date.now()
  if (previous !== browserNow) {
    for (const notify of listeners) notify()
  }

  return () => listeners.delete(listener)
}

const readClock = () => browserNow
const readServerClock = () => null

/**
 * Carries the clock the shell was prerendered with, so a relative label
 * ("3 days ago") can be part of the static shell and still be corrected by the
 * browser — the same two-step `HeaderDate` uses.
 */
export const ClockProvider = ({
  prerenderNow,
  children,
}: {
  /** The server's `getPrerenderNow()` value. */
  prerenderNow: string
  children: ReactNode
}) => (
  <PrerenderNowContext value={Date.parse(prerenderNow)}>
    {children}
  </PrerenderNowContext>
)

/** The reference instant for a relative label: the browser's clock once
 * mounted, the prerender's before that. */
export const useRelativeNow = (): number => {
  const prerenderNow = use(PrerenderNowContext)
  const now = useSyncExternalStore(subscribeToClock, readClock, readServerClock)

  if (prerenderNow === null) {
    throw new Error('useRelativeNow must be used within a ClockProvider')
  }

  return now ?? prerenderNow
}
