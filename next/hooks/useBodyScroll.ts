'use client'

import { useEffect } from 'react'

// A dialog can open a second dialog (a confirm inside a form, a preview inside
// the upload form), so the lock is counted and only the last release unlocks.
let lockCount = 0

const syncBodyScrollLock = () => {
  document.body.classList.toggle('overflow-y-hidden', lockCount > 0)
}

/**
 * Locks body scroll while `isLocked` is true. The lock is shared: closing a
 * dialog nested in another one leaves the outer dialog's lock in place.
 */
export const useBodyScrollLock = ({
  skipCheck = false,
  isLocked = false,
}: {
  skipCheck?: boolean
  isLocked?: boolean
}) => {
  useEffect(() => {
    if (skipCheck || !isLocked) return

    lockCount += 1
    syncBodyScrollLock()

    return () => {
      lockCount -= 1
      syncBodyScrollLock()
    }
  }, [isLocked, skipCheck])
}
