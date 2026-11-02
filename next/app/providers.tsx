'use client'

import { RestrictedActionModal } from '@/components/notifications/RestrictedActionModal'
import { AuthModalProvider } from '@/providers/AuthModalProvider'
import { LoadingProvider } from '@/providers/loading/LoadingProvider'
import { NotificationsProvider } from '@/providers/notification/NotificationProvider'
import { OnboardingProvider } from '@/providers/onboarding/OnboardingProvider'
import { ProfileProvider } from '@/providers/ProfileProvider'
import { SessionProvider } from '@/providers/SessionProvider'
import { ThemeProvider } from '@/providers/theme/ThemeProvider'
import { ToastProvider } from '@/providers/toaster/ToasterProvider'
import type { OnboardingCatalog } from '@/types/onboarding.types'

export function Providers({
  children,
  catalog,
}: {
  children: React.ReactNode
  catalog: OnboardingCatalog
}) {
  return (
    <LoadingProvider>
      <ThemeProvider>
        <ToastProvider>
          <SessionProvider>
            <ProfileProvider>
              <OnboardingProvider catalog={catalog}>
                <NotificationsProvider>
                  <AuthModalProvider>{children}</AuthModalProvider>
                  <RestrictedActionModal />
                </NotificationsProvider>
              </OnboardingProvider>
            </ProfileProvider>
          </SessionProvider>
        </ToastProvider>
      </ThemeProvider>
    </LoadingProvider>
  )
}
