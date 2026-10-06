'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react'
import {
  readLocalNotifications,
  subscribeToLocalNotifications,
  writeLocalNotifications,
} from '@/lib/notifications-storage'
import {
  hasCompletedOnboarding,
  subscribeToGuestAcademicData,
} from '@/lib/onboarding-storage'
import { accountHasAcademicData } from '@/lib/profile-sync'
import { useSession } from '@/providers/SessionProvider'
import type {
  AppNotification,
  NotificationsContextValue,
  PushInput,
} from '@/types/notifications.types'
import { useMyProfile } from '../ProfileProvider'
import { useToast } from '../toaster/ToasterProvider'

const ACCOUNT_REMINDER_ID = 'persistent:create-account'
const RESUME_ONBOARDING_NOTIFICATION_ID = 'onboarding:resume-reminder'
const EMPTY_NOTIFICATIONS: Array<AppNotification> = []

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null
)

/**
 * Local-first notification store, persisted to localStorage. `push` takes
 * only display data; id/date/read bookkeeping is handled here.
 *
 * `dismiss` removes the notification outright. `persistent: true`
 * notifications can never be dismissed, so the account-creation reminder
 * always has a place to reappear.
 */
export const NotificationsProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [trayOpen, setTrayOpen] = useState(false)
  const { addToast } = useToast()
  const { session } = useSession()
  const profile = useMyProfile()
  const onboardingCompleted = useSyncExternalStore(
    subscribeToGuestAcademicData,
    hasCompletedOnboarding,
    () => false
  )
  const accountOnboardingCompleted =
    session.status === 'authenticated' &&
    profile.status === 'loaded' &&
    accountHasAcademicData(profile.profile)
  const notifications = useSyncExternalStore(
    subscribeToLocalNotifications,
    readLocalNotifications,
    () => EMPTY_NOTIFICATIONS
  )

  useEffect(() => {
    let current = readLocalNotifications()
    const onboardingDone = onboardingCompleted || accountOnboardingCompleted
    const shouldShowAccountReminder =
      session.status === 'unauthenticated' && !onboardingDone

    if (shouldShowAccountReminder) {
      if (!current.some((n) => n.id === ACCOUNT_REMINDER_ID)) {
        current = [
          {
            id: ACCOUNT_REMINDER_ID,
            title: 'Create an account',
            body: 'Save your studies and progress so they follow you to any device.',
            createdAt: new Date().toISOString(),
            read: false,
            dismissed: false,
            persistent: true,
            type: 'info',
            action: {
              label: 'Create account',
              kind: 'link',
              href: '/auth?mode=register',
            },
          },
          ...current,
        ]
        writeLocalNotifications(current)
      }
    } else {
      const next = current.filter(
        (n) =>
          n.id !== ACCOUNT_REMINDER_ID &&
          (!onboardingDone || n.id !== RESUME_ONBOARDING_NOTIFICATION_ID)
      )
      if (next.length !== current.length) {
        current = next
        writeLocalNotifications(current)
      }
    }
  }, [accountOnboardingCompleted, onboardingCompleted, session.status])

  const push = (input: PushInput) => {
    const id = input.id ?? `local:${crypto.randomUUID()}`
    const existingIndex = notifications.findIndex((n) => n.id === id)
    const notification: AppNotification = {
      id,
      title: input.title,
      body: input.body,
      action: input.action,
      persistent: input.persistent,
      type: input.type ?? 'info',
      createdAt: new Date().toISOString(),
      read: false,
      dismissed: false,
    }
    const next =
      existingIndex === -1
        ? [notification, ...notifications]
        : notifications.map((n, i) => (i === existingIndex ? notification : n))
    writeLocalNotifications(next)

    addToast({
      title: input.title,
      description: input.body,
      type: input.type ?? 'info',
    })
  }

  const dismiss = (id: string) => {
    const target = notifications.find((n) => n.id === id)
    if (!target || target.persistent) return
    writeLocalNotifications(notifications.filter((n) => n.id !== id))
  }

  const dismissAll = () => {
    writeLocalNotifications(notifications.filter((n) => n.persistent))
  }

  const markRead = (id: string) => {
    writeLocalNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const markAllRead = () => {
    writeLocalNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationsContext.Provider
      value={{
        trayOpen,
        setTrayOpen,
        notifications,
        unreadCount,
        push,
        dismiss,
        dismissAll,
        markRead,
        markAllRead,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationsContext)
  if (!context)
    throw new Error(
      'useNotifications must be used within NotificationsProvider'
    )
  return context
}
