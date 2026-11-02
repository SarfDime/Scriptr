'use client'

import Checkmark from '@sanity/icons/Checkmark'
import CloseIcon from '@sanity/icons/Close'
import CloseCircle from '@sanity/icons/CloseCircle'
import { NOTIFICATIONS_STRINGS } from '@shared/strings/notifications-strings'
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
import { Divider } from '../ui/Divider'

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
        'ui-above-inside',
        !notification.read
      )}
    >
      <Box className='ui-cluster items-start gap-1'>
        <Text className='ui-body-strong mr-auto'>{notification.title}</Text>
        {!notification.read && !notification.persistent && (
          <Button
            onClick={() => markRead(notification.id)}
            aria-label={NOTIFICATIONS_STRINGS.markAsRead}
            className='button button-sm ghost p-0.5'
          >
            <Checkmark className='h-5 w-5 overwrite' />
          </Button>
        )}
        {!notification.persistent && (
          <Button
            onClick={() => dismiss(notification.id)}
            aria-label={NOTIFICATIONS_STRINGS.dismiss}
            className='button button-sm ghost p-0.5'
          >
            <CloseIcon className='h-5 w-5 overwrite' />
          </Button>
        )}
      </Box>
      <Divider className={palette} />
      {notification.body && (
        <Text className='ui-large-caption'>{notification.body}</Text>
      )}
      {notification.action?.kind === 'link' && notification.action.href && (
        <NextLink
          href={notification.action.href}
          onClick={() => markRead(notification.id)}
          className={cn('button button-sm w-fit', palette)}
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
          className={cn('button button-sm subtle w-fit', palette)}
        >
          {notification.action.label}
        </Button>
      )}
    </Box>
  )
}

/** Notification shade: a bell trigger plus a slide-over aside. The aside's
 * content only mounts while open. */
export const NotificationsAside = () => {
  const {
    notifications,
    dismissAll,
    trayOpen,
    setTrayOpen,
    loading,
    error,
    refresh,
  } = useNotifications()
  const hasDismissible = notifications.some(
    (notification) => !notification.persistent
  )

  return (
    <Dialog
      as='aside'
      aria-label={NOTIFICATIONS_STRINGS.openNotifications}
      isOpen={trayOpen}
      title={NOTIFICATIONS_STRINGS.trayTitle}
      hideTrigger
      onClose={() => setTrayOpen(false)}
      placement='right'
      hideBackdrop={true}
      dialogProps={{
        className: cn(
          'fixed top-16 z-50 ui-stack h-[calc(100%-4rem)] w-full max-w-full md:max-w-sm overflow-y-auto md:min-w-[unset] md:w-full',
          trayOpen && 'transition-transform transform translate-x-0',
          !trayOpen && 'transition-transform transform translate-x-full',
          'ui-above-nav rounded-none border-r-0 border-b-0 border-t-0 shadow-none'
        ),
      }}
      headerProps={{
        className: 'ui-cluster justify-between',
      }}
    >
      {hasDismissible && (
        <>
          <Button onClick={dismissAll} className='button button-sm subtle'>
            <CloseCircle />
            {NOTIFICATIONS_STRINGS.dismissAll}
          </Button>
          <Divider />
        </>
      )}
      {loading && (
        <Text className='ui-caption' aria-live='polite'>
          {NOTIFICATIONS_STRINGS.loading}
        </Text>
      )}
      {error && (
        <Box role='alert' className='ui-cluster justify-between'>
          <Text className='ui-caption'>{error}</Text>
          <Button onClick={refresh} className='button subtle px-3 py-1'>
            {NOTIFICATIONS_STRINGS.retry}
          </Button>
        </Box>
      )}
      {notifications.length > 0 ? (
        <Box className='ui-stack gap-2'>
          {notifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
            />
          ))}
        </Box>
      ) : (
        !loading && (
          <Text className='ui-caption'>{NOTIFICATIONS_STRINGS.empty}</Text>
        )
      )}
    </Dialog>
  )
}
