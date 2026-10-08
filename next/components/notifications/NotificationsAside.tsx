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
import { Dialog } from '../ui/Dialog'

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
        <Text className='ui-body-strong'>{notification.title}</Text>
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
        <Text className='ui-caption'>{notification.body}</Text>
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
          className='button button-sm subtle w-fit'
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
    <Dialog
      as='aside'
      aria-label='Notifications'
      isOpen={trayOpen}
      title='Notifications'
      hideTrigger
      onClose={() => setTrayOpen(false)}
      placement='right'
      hideBackdrop={true}
      dialogProps={{
        className: cn(
          'fixed top-16 z-50 ui-stack h-full w-full max-w-sm overflow-y-auto md:min-w-[unset] md:w-full',
          trayOpen && 'transition-transform transform translate-x-0',
          !trayOpen && 'transition-transform transform translate-x-full',
          'ui-above rounded-none border-r-0 border-b-0 border-t-0'
        ),
      }}
      headerProps={{
        className: 'ui-cluster justify-between',
      }}
    >
      {hasDismissible && (
        <>
          <Button onClick={dismissAll} className='button subtle px-3 py-1'>
            Dismiss all
          </Button>
          {/* <Divider orientation='vertical' className='h-full' /> */}
        </>
      )}
      {notifications?.length > 0 ? (
        <Box className='ui-stack gap-2'>
          {notifications?.map((n) => (
            <NotificationRow key={n?.id} notification={n} />
          ))}
        </Box>
      ) : (
        <Text className='ui-caption'>You're all caught up.</Text>
      )}
    </Dialog>
  )
}
