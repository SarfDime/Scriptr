'use client'

import type { LocaleId } from '@shared/config/localization-constants'
import { RestrictedActionModal } from '@/components/notifications/RestrictedActionModal'
import { AuthModalProvider } from '@/providers/AuthModalProvider'
import { CalendarNotesProvider } from '@/providers/calendar-notes/CalendarNotesProvider'
import { LoadingProvider } from '@/providers/loading/LoadingProvider'
import { LocaleProvider } from '@/providers/locale/LocaleProvider'
import { NotificationsProvider } from '@/providers/notification/NotificationProvider'
import { ProfileProvider } from '@/providers/ProfileProvider'
import { SessionProvider } from '@/providers/SessionProvider'
import { ThemeProvider } from '@/providers/theme/ThemeProvider'
import { ToastProvider } from '@/providers/toaster/ToasterProvider'

export function Providers({
  locale,
  children,
}: {
  /** The language the route resolved to; nothing below may disagree with it. */
  locale: LocaleId
  children: React.ReactNode
}) {
  return (
    <LocaleProvider locale={locale}>
      <LoadingProvider>
        <ThemeProvider>
          <ToastProvider>
            <SessionProvider>
              <ProfileProvider>
                <NotificationsProvider>
                  <CalendarNotesProvider>
                    <AuthModalProvider>{children}</AuthModalProvider>
                    <RestrictedActionModal />
                  </CalendarNotesProvider>
                </NotificationsProvider>
              </ProfileProvider>
            </SessionProvider>
          </ToastProvider>
        </ThemeProvider>
      </LoadingProvider>
    </LocaleProvider>
  )
}
