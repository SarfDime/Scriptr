'use client'

import { NotificationsProvider } from '@/providers/notification/NotificationProvider'
import { OnboardingProvider } from '@/providers/onboarding/OnboardingProvider'
import { ThemeProvider } from '@/providers/theme/ThemeProvider'
import { ToastProvider } from '@/providers/toaster/ToasterProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <OnboardingProvider>
        <NotificationsProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </NotificationsProvider>
      </OnboardingProvider>
    </ToastProvider>
  )
}
