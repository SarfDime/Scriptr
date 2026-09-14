'use client'

import { createContext, useContext, useState } from 'react'
import { useMicrotaskEffect } from '@/hooks/useMicrotaskEffect'
import {
  hasCompletedOnboarding,
  hasDismissedOnboarding,
} from '@/lib/onboarding-storage'

type OnboardingContextValue = {
  isOpen: boolean
  open: () => void
  close: () => void
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

export const OnboardingProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [isOpen, setIsOpen] = useState(false)

  useMicrotaskEffect(() => {
    if (!hasCompletedOnboarding() && !hasDismissedOnboarding()) {
      setIsOpen(true)
    }
  })

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)

  return (
    <OnboardingContext.Provider value={{ isOpen, open, close }}>
      {children}
    </OnboardingContext.Provider>
  )
}

export const useOnboarding = () => {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider')
  }
  return context
}
