'use client'

import CloseIcon from '@sanity/icons/Close'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { NextLink } from '@/components/common/NextLink'
import { Text } from '@/components/typography/Text'
import { cn } from '@/lib/common-utils'
import { useNotifications } from '@/providers/notification/NotificationProvider'
import { useOnboarding } from '@/providers/onboarding/OnboardingProvider'
import {
  type AppNotification,
  NOTIFICATION_PALETTE,
} from '@/types/notifications.types'

const NotificationRow = ({
  notification,
}: {
  notification: AppNotification
}) => {
  const { dismiss, markRead } = useNotifications()
  const { open } = useOnboarding()
  const palette = NOTIFICATION_PALETTE[notification.type ?? 'info']

  return (
    <Box
      className={cn(
        'ui-stack gap-2 rounded-lg border p-3 border-l-4',
        palette,
        !notification.read
      )}
    >
      <Box className='ui-cluster items-start justify-between gap-2'>
        <Text className='ui-body font-medium'>{notification.title}</Text>
        {!notification.persistent && (
          <Button
            onClick={() => dismiss(notification.id)}
            aria-label='Dismiss notification'
            className='button subtle p-1'
          >
            <CloseIcon />
          </Button>
        )}
      </Box>
      {notification.body && (
        <Text className='ui-caption text-grey-500'>{notification.body}</Text>
      )}
      {notification.action?.kind === 'link' && notification.action.href && (
        <NextLink
          href={notification.action.href}
          className='ui-caption hover:underline'
          onClick={() => markRead(notification.id)}
        >
          {notification.action.label}
        </NextLink>
      )}
      {notification.action?.kind === 'open-onboarding' && (
        <Button
          onClick={() => {
            markRead(notification.id)
            open()
          }}
          className='button subtle w-fit ui-caption px-2 py-1'
        >
          {notification.action.label}
        </Button>
      )}
    </Box>
  )
}

// ...NotificationsAside unchanged...
/** Notification shade: a bell trigger plus a slide-over aside. The aside's
 * content only mounts while open. */
export const NotificationsAside = () => {
  const { notifications, dismissAll, trayOpen, setTrayOpen } =
    useNotifications()
  const hasDismissible = notifications?.some((n) => !n?.persistent)

  return (
    <>
      {trayOpen && (
        <>
          {/* <Box
            className='fixed inset-0 z-40 bg-background-1000/50'
            onClick={() => setTrayOpen(false)}
          /> */}
          <Box
            as='aside'
            aria-label='Notifications'
            className={cn(
              'fixed top-16 right-0 z-50 ui-stack h-full w-full max-w-sm gap-3 overflow-y-auto p-4',
              trayOpen && 'transition-transform transform translate-x-0',
              !trayOpen && 'transition-transform transform translate-x-full',
              'ui-above border-l'
            )}
          >
            <Box className='ui-cluster items-center justify-between'>
              <Text className='ui-title font-semibold'>Notifications</Text>
              <Box className='ui-cluster items-center gap-1'>
                {hasDismissible && (
                  <Button
                    onClick={dismissAll}
                    className='button subtle ui-caption px-2 py-1'
                  >
                    Dismiss all
                  </Button>
                )}
                <Button
                  onClick={() => setTrayOpen(false)}
                  aria-label='Close notifications'
                  className='button subtle p-1'
                >
                  <CloseIcon />
                </Button>
              </Box>
            </Box>
            {notifications?.length > 0 ? (
              <Box className='ui-stack gap-2'>
                {notifications?.map((n) => (
                  <NotificationRow key={n?.id} notification={n} />
                ))}
              </Box>
            ) : (
              <Text className='ui-caption text-grey-500'>
                You're all caught up.
              </Text>
            )}
          </Box>
        </>
      )}
    </>
  )
}
