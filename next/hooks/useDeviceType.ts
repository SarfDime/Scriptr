'use client'

import { useEffect, useState } from 'react'

import { detectDeviceType } from '../lib/common-utils'

// Custom hook to get the device type
export const useDeviceType = (): 'desktop' | 'tablet' | 'mobile' => {
  const [deviceType, setDeviceType] = useState<'desktop' | 'tablet' | 'mobile'>(
    detectDeviceType()
  )

  useEffect(() => {
    const handleResize = () => {
      setDeviceType(detectDeviceType())
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return deviceType
}
