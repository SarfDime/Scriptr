'use client'

import { createContext, useContext, useState } from 'react'
import { useMicrotaskEffect } from '@/hooks/useMicrotaskEffect'
import { useToastHook } from '@/hooks/useToast'
import {
  readLocalNotifications,
  writeLocalNotifications,
} from '@/lib/notifications-storage'
import { hasCompletedOnboarding } from '@/lib/onboarding-storage'
import type {
  AppNotification,
  NotificationsContextValue,
  PushInput,
} from '@/types/notifications.types'

const ACCOUNT_REMINDER_ID = 'persistent:create-account'

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
  const [notifications, setNotifications] = useState<Array<AppNotification>>([])
  const [trayOpen, setTrayOpen] = useState(false)
  const { showToast } = useToastHook()

  useMicrotaskEffect(() => {
    let current = readLocalNotifications()
    if (!hasCompletedOnboarding()) {
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
            action: { label: 'Create account', kind: 'link', href: '/sign-up' },
          },
          ...current,
        ]
        writeLocalNotifications(current)
      }
    }

    setNotifications(current)
  })

  const push = (input: PushInput) => {
    setNotifications((current) => {
      const id = input.id ?? `local:${crypto.randomUUID()}`
      const existingIndex = current.findIndex((n) => n.id === id)

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
          ? [notification, ...current]
          : current.map((n, i) => (i === existingIndex ? notification : n))

      writeLocalNotifications(next)
      return next
    })

    showToast({
      title: input.title,
      description: input.body,
      type: input.type ?? 'info',
    })
  }

  const dismiss = (id: string) => {
    setNotifications((current) => {
      const target = current.find((n) => n.id === id)
      if (!target || target.persistent) return current

      const next = current.filter((n) => n.id !== id)
      writeLocalNotifications(next)
      return next
    })
  }

  const dismissAll = () => {
    setNotifications((current) => {
      const next = current.filter((n) => n.persistent)
      writeLocalNotifications(next)
      return next
    })
  }

  const markRead = (id: string) => {
    setNotifications((current) => {
      const next = current.map((n) => (n.id === id ? { ...n, read: true } : n))
      writeLocalNotifications(next)
      return next
    })
  }

  const markAllRead = () => {
    setNotifications((current) => {
      const next = current.map((n) => ({ ...n, read: true }))
      writeLocalNotifications(next)
      return next
    })
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
