'use client'

import {
  DEFAULT_PROFILE_PREFERENCES,
  isProfilePreferences,
} from '@shared/config/profile-preferences'
import { NOTIFICATIONS_STRINGS } from '@shared/strings/notifications-strings'
import type {
  ProfilePreferences,
  ProfilePreferencesResponse,
} from '@shared/types/profile-preferences.types'
import type { MyRestriction } from '@shared/types/restrictions.types'
import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import {
  readCachedPreferences,
  readCachedRestriction,
  writeCachedPreferences,
  writeCachedRestriction,
} from '@/lib/account-state-storage'
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  setNotificationRead,
} from '@/lib/api/notifications-api'
import { getMyProfilePreferences } from '@/lib/api/profile-api'
import { getMyRestriction } from '@/lib/api/restrictions-api'
import { mapNotificationRecord } from '@/lib/notification-mapper'
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
import type {
  AppNotification,
  NotificationsContextValue,
  PushInput,
} from '@/types/notifications.types'
import { useMyProfile } from '../ProfileProvider'
import { useSession } from '../SessionProvider'
import { useToast } from '../toaster/ToasterProvider'

const ACCOUNT_REMINDER_ID = 'persistent:create-account'
const RESUME_ONBOARDING_NOTIFICATION_ID = 'onboarding:resume-reminder'
const EMPTY_NOTIFICATIONS: Array<AppNotification> = []
const MAX_TRAY_NOTIFICATIONS = 100
const MODERATION_TYPES = new Set([
  'restriction_applied',
  'restriction_lifted',
  'content_removed',
  'flag_threshold',
])

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null
)

const getEffectivePreferences = (response: ProfilePreferencesResponse) => {
  const { preferences } = response
  if (isProfilePreferences(preferences)) return preferences
  return DEFAULT_PROFILE_PREFERENCES
}

const isRestrictionLapsed = (restriction: MyRestriction) =>
  Boolean(restriction?.expires_at) &&
  Date.parse(restriction?.expires_at ?? '') <= Date.now()

const newestModerationId = (items: Array<AppNotification>) =>
  items
    .filter(
      (item) =>
        item.sourceType === 'restriction_applied' ||
        item.sourceType === 'restriction_lifted'
    )
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0]?.id ??
  null

const buildRestrictionNotice = (
  restriction: MyRestriction
): AppNotification | null => {
  if (!restriction || isRestrictionLapsed(restriction)) return null
  return {
    id: 'persistent:restriction',
    title: NOTIFICATIONS_STRINGS.restrictionTitle,
    body: NOTIFICATIONS_STRINGS.restrictionNoticeBody(
      restriction.reason,
      restriction.expires_at
    ),
    createdAt: restriction.created_at,
    read: true,
    dismissed: false,
    persistent: true,
    type: 'restriction_applied',
    sourceType: 'restriction_applied',
  }
}

const getServerId = (id: string) =>
  id.startsWith('server:') ? id.slice('server:'.length) : null

const sortNotifications = (items: Array<AppNotification>) =>
  [...items].sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1
    return Date.parse(b.createdAt) - Date.parse(a.createdAt)
  })

/** Opening the tray repeatedly refetches at most this often. */
const TRAY_REFRESH_MIN_INTERVAL_MS = 15_000

export const NotificationsProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [trayOpen, setTrayOpen] = useState(false)
  const [serverNotifications, setServerNotifications] = useState<
    Array<AppNotification>
  >([])
  const [serverOwnerId, setServerOwnerId] = useState<string | null>(null)
  const [restrictedModalOpen, setRestrictedModalOpen] = useState(false)
  const [persistentRestriction, setPersistentRestriction] =
    useState<AppNotification | null>(null)
  const [restrictionOwnerId, setRestrictionOwnerId] = useState<string | null>(
    null
  )
  const [preferences, setPreferences] = useState(DEFAULT_PROFILE_PREFERENCES)
  const [preferencesOwnerId, setPreferencesOwnerId] = useState<string | null>(
    null
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loadedUserIdRef = useRef<string | null>(null)
  const seenServerIdsRef = useRef(new Set<string>())
  const { addToast } = useToast()
  const { session } = useSession()
  const lastTrayRefreshRef = useRef(0)
  const profile = useMyProfile()
  const currentUserId =
    session.status === 'authenticated' ? session.user.id : null
  const localNotifications = useSyncExternalStore(
    (listener) =>
      subscribeToLocalNotifications(listener, currentUserId ?? undefined),
    () => readLocalNotifications(currentUserId ?? undefined),
    () => EMPTY_NOTIFICATIONS
  )
  const onboardingCompleted = useSyncExternalStore(
    subscribeToGuestAcademicData,
    hasCompletedOnboarding,
    () => false
  )
  const accountOnboardingCompleted =
    session.status === 'authenticated' &&
    profile.status === 'loaded' &&
    accountHasAcademicData(profile.profile)
  const activePreferences =
    preferencesOwnerId === currentUserId
      ? preferences
      : DEFAULT_PROFILE_PREFERENCES

  const loadServerNotifications = useEffectEvent(() => {
    if (session.status !== 'authenticated') {
      Promise.resolve().then(() => {
        setServerNotifications([])
        setServerOwnerId(null)
        setPersistentRestriction(null)
        setRestrictedModalOpen(false)
        setRestrictionOwnerId(null)
        setPreferences(DEFAULT_PROFILE_PREFERENCES)
        setPreferencesOwnerId(null)
        setError(null)
      })
      return
    }

    const userId = session.user.id
    Promise.resolve().then(() => setLoading(true))
    // Restriction and preferences come from local storage and only hit the
    // API when nothing is cached, a cached restriction has lapsed, or a new
    // restriction notification shows the cached one is out of date.
    const cachedPreferences = readCachedPreferences(userId)
    const cachedRestriction = readCachedRestriction(userId)
    const reusableRestriction =
      cachedRestriction && !isRestrictionLapsed(cachedRestriction.restriction)
        ? cachedRestriction
        : null
    Promise.allSettled([
      getNotifications(),
      reusableRestriction
        ? Promise.resolve(reusableRestriction.restriction)
        : getMyRestriction(),
      cachedPreferences
        ? Promise.resolve(cachedPreferences)
        : getMyProfilePreferences().then(getEffectivePreferences),
    ]).then(
      async ([notificationsResult, restrictionResult, preferencesResult]) => {
        const failures: Array<unknown> = []
        const effectivePreferences =
          preferencesResult.status === 'fulfilled'
            ? preferencesResult.value
            : activePreferences
        let moderationId: string | null = null
        if (notificationsResult.status === 'rejected') {
          failures.push(notificationsResult.reason)
        } else {
          const mapped = notificationsResult.value.map(mapNotificationRecord)
          moderationId = newestModerationId(mapped)
          const isInitialLoad = loadedUserIdRef.current !== userId
          if (isInitialLoad) {
            loadedUserIdRef.current = userId
            seenServerIdsRef.current.clear()
          } else {
            for (const notification of mapped) {
              if (
                seenServerIdsRef.current.has(notification.id) ||
                (notification.sourceType === 'achievement_earned' &&
                  effectivePreferences.notifications.achievements === 'hide')
              ) {
                continue
              }
              const isModeration = Boolean(
                notification.sourceType &&
                  MODERATION_TYPES.has(notification.sourceType)
              )
              if (isModeration || effectivePreferences.notifications.toasts) {
                let toastType: 'success' | 'warning' | 'info' = 'info'
                if (notification.sourceType === 'achievement_earned') {
                  toastType = 'success'
                } else if (isModeration) {
                  toastType = 'warning'
                }
                addToast({
                  title: notification.title,
                  description: notification.body,
                  type: toastType,
                })
              }
            }
          }
          for (const notification of mapped) {
            seenServerIdsRef.current.add(notification.id)
          }
          setServerNotifications(mapped)
          setServerOwnerId(userId)
        }

        if (restrictionResult.status === 'fulfilled') {
          let restriction = restrictionResult.value
          const restrictionChanged =
            reusableRestriction !== null &&
            notificationsResult.status === 'fulfilled' &&
            moderationId !== reusableRestriction.moderationId
          let restrictionFailed = false
          if (restrictionChanged) {
            try {
              restriction = await getMyRestriction()
            } catch (reason) {
              restrictionFailed = true
              failures.push(reason)
            }
          }
          if (!restrictionFailed) {
            if (!reusableRestriction || restrictionChanged) {
              writeCachedRestriction(userId, { restriction, moderationId })
            }
            setPersistentRestriction(buildRestrictionNotice(restriction))
            setRestrictionOwnerId(userId)
          }
        } else {
          failures.push(restrictionResult.reason)
        }

        if (preferencesResult.status === 'fulfilled') {
          if (!cachedPreferences) {
            writeCachedPreferences(userId, preferencesResult.value)
          }
          setPreferences(preferencesResult.value)
          setPreferencesOwnerId(userId)
        } else {
          failures.push(preferencesResult.reason)
        }

        setError(failures.length > 0 ? NOTIFICATIONS_STRINGS.loadError : null)
        setLoading(false)
      }
    )
  })

  useEffect(() => {
    if (session.status !== 'loading') loadServerNotifications()
  }, [session.status])

  useEffect(() => {
    if (trayOpen && session.status === 'authenticated') {
      const now = Date.now()
      if (now - lastTrayRefreshRef.current < TRAY_REFRESH_MIN_INTERVAL_MS) {
        return
      }
      lastTrayRefreshRef.current = now
      loadServerNotifications()
    }
  }, [trayOpen, session.status])

  useEffect(() => {
    if (session.status === 'loading') return
    let current = readLocalNotifications(currentUserId ?? undefined)
    const onboardingDone = onboardingCompleted || accountOnboardingCompleted
    const shouldShowAccountReminder =
      session.status === 'unauthenticated' && !onboardingDone

    if (shouldShowAccountReminder) {
      if (
        !current.some((notification) => notification.id === ACCOUNT_REMINDER_ID)
      ) {
        current = [
          {
            id: ACCOUNT_REMINDER_ID,
            title: NOTIFICATIONS_STRINGS.accountReminderTitle,
            body: NOTIFICATIONS_STRINGS.accountReminderBody,
            createdAt: new Date().toISOString(),
            read: false,
            dismissed: false,
            persistent: true,
            type: 'info',
            action: {
              label: NOTIFICATIONS_STRINGS.createAccount,
              kind: 'link',
              href: '/auth?mode=register',
            },
          },
          ...current,
        ]
        writeLocalNotifications(current, currentUserId ?? undefined)
      }
    } else {
      const next = current.filter(
        (notification) =>
          notification.id !== ACCOUNT_REMINDER_ID &&
          (!onboardingDone ||
            notification.id !== RESUME_ONBOARDING_NOTIFICATION_ID)
      )
      if (next.length !== current.length) {
        current = next
        writeLocalNotifications(current, currentUserId ?? undefined)
      }
    }
  }, [
    accountOnboardingCompleted,
    currentUserId,
    onboardingCompleted,
    session.status,
  ])

  const activeRestrictionNotice =
    restrictionOwnerId === currentUserId ? persistentRestriction : null
  // While restricted, the persistent notice replaces the dismissible
  // "restriction applied" row so the user can't clear the only visible copy.
  const visibleServerNotifications =
    serverOwnerId === currentUserId
      ? serverNotifications.filter(
          (notification) =>
            (notification.sourceType !== 'achievement_earned' ||
              activePreferences.notifications.achievements === 'show') &&
            !(
              activeRestrictionNotice &&
              notification.sourceType === 'restriction_applied'
            )
        )
      : EMPTY_NOTIFICATIONS
  const sortedNotifications = sortNotifications([
    ...localNotifications,
    ...visibleServerNotifications,
    ...(activeRestrictionNotice ? [activeRestrictionNotice] : []),
  ])
  const unreadCount = sortedNotifications.filter(
    (notification) => !notification.read
  ).length
  const notifications = sortedNotifications.slice(0, MAX_TRAY_NOTIFICATIONS)

  const push = (input: PushInput) => {
    const id = input.id ?? `local:${crypto.randomUUID()}`
    const existingIndex = localNotifications.findIndex(
      (notification) => notification.id === id
    )
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
        ? [notification, ...localNotifications]
        : localNotifications.map((item, index) =>
            index === existingIndex ? notification : item
          )
    writeLocalNotifications(next, currentUserId ?? undefined)
    if (!input.persistent && activePreferences.notifications.toasts) {
      addToast({
        title: input.title,
        description: input.body,
        type: input.type ?? 'info',
      })
    }
  }

  const dismiss = (id: string) => {
    const target = notifications.find((notification) => notification.id === id)
    if (!target || target.persistent) return
    const serverId = getServerId(id)
    if (serverId) {
      deleteNotification(serverId)
        .then(() =>
          setServerNotifications((current) =>
            current.filter((notification) => notification.id !== id)
          )
        )
        .catch(() => setError(NOTIFICATIONS_STRINGS.updateError))
      return
    }
    writeLocalNotifications(
      localNotifications.filter((notification) => notification.id !== id),
      currentUserId ?? undefined
    )
  }

  const dismissAll = () => {
    writeLocalNotifications(
      localNotifications.filter((notification) => notification.persistent),
      currentUserId ?? undefined
    )
    const dismissibleServer = visibleServerNotifications.filter(
      (notification) => !notification.persistent
    )
    Promise.allSettled(
      dismissibleServer.flatMap((notification) => {
        const serverId = getServerId(notification.id)
        return serverId ? [deleteNotification(serverId)] : []
      })
    ).then((results) => {
      const removedIds = new Set<string>()
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          removedIds.add(dismissibleServer[index]?.id ?? '')
        }
      })
      setServerNotifications((current) =>
        current.filter((notification) => !removedIds.has(notification.id))
      )
      if (results.some((result) => result.status === 'rejected')) {
        setError(NOTIFICATIONS_STRINGS.updateError)
      }
    })
  }

  const markRead = (id: string) => {
    const serverId = getServerId(id)
    if (serverId) {
      setNotificationRead(serverId, true)
        .then(() =>
          setServerNotifications((current) =>
            current.map((notification) =>
              notification.id === id
                ? { ...notification, read: true }
                : notification
            )
          )
        )
        .catch(() => setError(NOTIFICATIONS_STRINGS.updateError))
      return
    }
    writeLocalNotifications(
      localNotifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      ),
      currentUserId ?? undefined
    )
  }

  const markAllRead = () => {
    writeLocalNotifications(
      localNotifications.map((notification) => ({
        ...notification,
        read: true,
      })),
      currentUserId ?? undefined
    )
    if (!currentUserId) return
    markAllNotificationsRead()
      .then(() =>
        setServerNotifications((current) =>
          current.map((notification) => ({ ...notification, read: true }))
        )
      )
      .catch(() => setError(NOTIFICATIONS_STRINGS.updateError))
  }

  const refresh = () => loadServerNotifications()

  /** Rereads the restriction after the API rejected an action as restricted,
   * so the notice shows without the tray being opened. */
  const syncRestriction = () => {
    if (!currentUserId) return
    const userId = currentUserId
    getMyRestriction()
      .then((restriction) => {
        writeCachedRestriction(userId, {
          restriction,
          moderationId: newestModerationId(serverNotifications),
        })
        setPersistentRestriction(buildRestrictionNotice(restriction))
        setRestrictionOwnerId(userId)
      })
      .catch(() => setError(NOTIFICATIONS_STRINGS.loadError))
  }

  /** Stores freshly saved preferences locally so nothing needs refetching. */
  const applyPreferences = (saved: ProfilePreferences) => {
    if (!currentUserId) return
    writeCachedPreferences(currentUserId, saved)
    setPreferences(saved)
    setPreferencesOwnerId(currentUserId)
  }

  return (
    <NotificationsContext.Provider
      value={{
        trayOpen,
        setTrayOpen,
        notifications,
        unreadCount,
        loading,
        error,
        refresh,
        preferences: activePreferences,
        preferencesReady: preferencesOwnerId === currentUserId,
        applyPreferences,
        syncRestriction,
        restrictionNotice: activeRestrictionNotice,
        restrictedModalOpen,
        openRestrictedModal: () => setRestrictedModalOpen(true),
        closeRestrictedModal: () => setRestrictedModalOpen(false),
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
