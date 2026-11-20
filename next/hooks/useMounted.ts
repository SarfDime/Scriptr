'use client'

import { useSyncExternalStore } from 'react'

const subscribeToMount = () => () => {
  // Mounting is a one-way trip; there is nothing to unsubscribe from.
}
const getMounted = () => true
const getServerMounted = () => false

/** `true` only after hydration, so the server render and the first client
 * render are identical — for anything that needs `Date.now()`, the session or
 * `localStorage`, none of which the server has. */
export const useMounted = () =>
  useSyncExternalStore(subscribeToMount, getMounted, getServerMounted)
