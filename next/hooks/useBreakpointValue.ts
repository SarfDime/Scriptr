'use client'

import { useEffect, useState } from 'react'

const breakpoints = {
  xxl: 1537,
  xml: 1401,
  xl: 1281,
  lg: 993,
  xmd: 881,
  md: 769,
  smd: 641,
  sm: 481,
  base: 0,
}

/** Custom hook to determine if the current window width matches any of the specified breakpoints. */
export const useBreakpointValue = (
  breakpointsArray: Array<keyof typeof breakpoints>
): { isBreakpoint: boolean; isLoading: boolean } => {
  const [isBreakpoint, setIsBreakpoint] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const checkBreakpoints = () => {
    const width = window.innerWidth
    for (const breakpoint of breakpointsArray) {
      if (width >= breakpoints[breakpoint]) {
        return true
      }
    }
    return false
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <Will cause unnecessary re-renders>
  useEffect(() => {
    const handleResize = () => {
      setIsBreakpoint(checkBreakpoints())
      setIsLoading(false)
    }

    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [breakpointsArray])

  return { isBreakpoint, isLoading }
}
