'use client'

import type { LocaleId } from '@shared/config/localization-constants'
import { RestrictedActionModal } from '@/components/notifications/RestrictedActionModal'
import { AuthModalProvider } from '@/providers/AuthModalProvider'
import { CalendarNotesProvider } from '@/providers/calendar-notes/CalendarNotesProvider'
import { ClockProvider } from '@/providers/clock/clock'
import { LoadingProvider } from '@/providers/loading/LoadingProvider'
import { LocaleProvider } from '@/providers/locale/LocaleProvider'
import { PathnameScope } from '@/providers/nav/pathname-scope'
import { NotificationsProvider } from '@/providers/notification/NotificationProvider'
import { ProfileProvider } from '@/providers/ProfileProvider'
import { SessionProvider } from '@/providers/SessionProvider'
import { ThemeProvider } from '@/providers/theme/ThemeProvider'
import { ToastProvider } from '@/providers/toaster/ToasterProvider'

export function Providers({
  locale,
  prerenderNow,
  children,
}: {
  /** The language the route resolved to; nothing below may disagree with it. */
  locale: LocaleId
  /** The clock the shell was prerendered with (`getPrerenderNow`). */
  prerenderNow: string
  children: React.ReactNode
}) {
  return (
    <LocaleProvider locale={locale}>
      <ClockProvider prerenderNow={prerenderNow}>
        <LoadingProvider>
          <ThemeProvider>
            <ToastProvider>
              <SessionProvider>
                <ProfileProvider>
                  <NotificationsProvider>
                    <CalendarNotesProvider>
                      <PathnameScope />
                      <AuthModalProvider>{children}</AuthModalProvider>
                      <RestrictedActionModal />
                    </CalendarNotesProvider>
                  </NotificationsProvider>
                </ProfileProvider>
              </SessionProvider>
            </ToastProvider>
          </ThemeProvider>
        </LoadingProvider>
      </ClockProvider>
    </LocaleProvider>
  )
}
