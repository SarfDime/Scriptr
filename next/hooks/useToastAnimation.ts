'use client'

import { useEffect, useRef, useState } from 'react'

import type { ToastAnimationProps } from '../types/components/Toast.types'

/** How long the slide-out runs before the toast leaves the list. */
const EXIT_DURATION_MS = 300

/** Whether the toast is exiting, and the callback that starts its exit.
 *
 * The exit runs on the `startExitAnimation` callback and again after the
 * `duration` timer, and `onDismiss` is what actually removes the toast. The
 * timer is always scheduled, once: a toast that has started leaving must not
 * schedule a second removal.
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
