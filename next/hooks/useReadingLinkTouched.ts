'use client'

import { useState } from 'react'

/**
 * Tracks which additional-reading rows the user has left, so a half-typed URL
 * isn't flagged while typing. Rows are identified by index, so removing one
 * has to shift every later index down (`forgetRemoved`).
 */
export function useReadingLinkTouched() {
  const [touched, setTouched] = useState<ReadonlySet<number>>(new Set())

  const touch = (index: number) =>
    setTouched((current) => new Set(current).add(index))

  const touchAll = (count: number) =>
    setTouched(new Set(Array.from({ length: count }, (_, index) => index)))

  const reset = () => setTouched(new Set())

  const forgetRemoved = (index: number) =>
    setTouched(
      (current) =>
        new Set(
          [...current]
            .filter((entry) => entry !== index)
            .map((entry) => (entry > index ? entry - 1 : entry))
        )
    )

  return { touched, touch, touchAll, reset, forgetRemoved }
}
