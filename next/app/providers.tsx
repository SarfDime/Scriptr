'use client'

import { RestrictedActionModal } from '@/components/notifications/RestrictedActionModal'
import { AuthModalProvider } from '@/providers/AuthModalProvider'
import { CalendarNotesProvider } from '@/providers/calendar-notes/CalendarNotesProvider'
import { LoadingProvider } from '@/providers/loading/LoadingProvider'
import { NotificationsProvider } from '@/providers/notification/NotificationProvider'
import { OnboardingProvider } from '@/providers/onboarding/OnboardingProvider'
import { ProfileProvider } from '@/providers/ProfileProvider'
import { SessionProvider } from '@/providers/SessionProvider'
import { ThemeProvider } from '@/providers/theme/ThemeProvider'
import { ToastProvider } from '@/providers/toaster/ToasterProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LoadingProvider>
      <ThemeProvider>
        <ToastProvider>
          <SessionProvider>
            <ProfileProvider>
              <OnboardingProvider>
                <NotificationsProvider>
                  <CalendarNotesProvider>
                    <AuthModalProvider>{children}</AuthModalProvider>
                    <RestrictedActionModal />
                  </CalendarNotesProvider>
                </NotificationsProvider>
              </OnboardingProvider>
            </ProfileProvider>
          </SessionProvider>
        </ToastProvider>
      </ThemeProvider>
    </LoadingProvider>
  )
}
