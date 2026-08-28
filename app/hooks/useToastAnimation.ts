import { useEffect, useRef, useState } from 'react'

import type { ToastAnimationProps } from '../types/components/Toast.types'

/** Returns an object with a boolean indicating whether the toast is exiting and
 * a callback to start the exit animation.
 *
 * The exit animation is triggered by the `startExitAnimation` callback or
 * after a duration (in milliseconds) has passed since the toast was rendered.
 *
 * The `onDismiss` callback is called when the toast is exiting.
 */
export const useToastAnimation = ({
  id,
  duration,
  onDismiss,
}: ToastAnimationProps) => {
  const [isExiting, setIsExiting] = useState(false)
  const dismissTimerRef = useRef<NodeJS.Timeout>(null)

  const startExitAnimation = () => {
    setIsExiting(true)
    if (dismissTimerRef?.current) {
      dismissTimerRef.current = setTimeout(() => {
        onDismiss(id)
      }, 300)
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <No need to add onDismiss and id to deps>
  useEffect(() => {
    const timer = setTimeout(startExitAnimation, duration - 300)
    return () => {
      clearTimeout(timer)
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
    }
  }, [duration])

  return { isExiting, startExitAnimation }
}
