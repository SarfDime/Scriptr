import { useEffect } from 'react'

/** Hook to lock or unlock body scroll based on the isLocked parameter.
 * When isLocked is true, the body's overflow-y is set to hidden to prevent scrolling.
 * When isLocked is false, the body's overflow-y is restored to its default state.
 */
export const useBodyScrollLock = ({
  skipCheck = false,
  isLocked = false,
}: {
  skipCheck?: boolean
  isLocked?: boolean
}) => {
  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    if (skipCheck) {
      return
    }

    const { body } = document

    if (isLocked) {
      body.classList.add('overflow-y-hidden')
    } else {
      body.classList.remove('overflow-y-hidden')
    }

    // Cleanup function
    return () => {
      body.classList.remove('overflow-y-hidden')
    }
  }, [isLocked, skipCheck])
}
