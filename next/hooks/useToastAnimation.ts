'use client'

import { useEffect, useRef, useState } from 'react'

import type { ToastAnimationProps } from '../types/components/Toast.types'

/** How long the slide-out runs before the toast leaves the list. */
const EXIT_DURATION_MS = 300

/** Returns an object with a boolean indicating whether the toast is exiting and
 * a callback to start the exit animation.
 *
 * The exit animation is triggered by the `startExitAnimation` callback or
 * after a duration (in milliseconds) has passed since the toast was rendered.
 *
 * `onDismiss` is what actually removes the toast. It used to be scheduled only
 * when the ref already held a timer, which it never did, so dismissing only
 * faded the toast out: the element stayed in the list, invisible but still on
 * top of the page, and swallowed every click where it sat. The timer is now
 * always scheduled, once, so a toast that has started leaving cannot schedule
 * a second removal.
 */
export const useToastAnimation = ({
  id,
  duration,
  onDismiss,
}: ToastAnimationProps) => {
  const [isExiting, setIsExiting] = useState(false)
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startExitAnimation = () => {
    setIsExiting(true)
    if (dismissTimerRef.current) return
    dismissTimerRef.current = setTimeout(() => onDismiss(id), EXIT_DURATION_MS)
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <No need to add onDismiss and id to deps>
  useEffect(() => {
    const timer = setTimeout(
      startExitAnimation,
      Math.max(0, duration - EXIT_DURATION_MS)
    )
    return () => {
      clearTimeout(timer)
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
    }
  }, [duration])

  return { isExiting, startExitAnimation }
}
