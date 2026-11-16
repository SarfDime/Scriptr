'use client'

import { useEffect, useLayoutEffect } from 'react'

/** `useLayoutEffect` warns when it runs during SSR, and these components render
 * on the server, so fall back to `useEffect` there. */
export const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect
