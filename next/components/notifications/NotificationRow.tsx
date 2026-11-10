'use client'

import Checkmark from '@sanity/icons/Checkmark'
import CloseIcon from '@sanity/icons/Close'
import {
  NOTIFICATION_TYPE_STRINGS,
  NOTIFICATIONS_STRINGS,
} from '@shared/strings/notifications-strings'
import { formatDate } from '@shared/utils/common-utils'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { NextLink } from '@/components/common/NextLink'
import { Text } from '@/components/typography/Text'
import { cn } from '@/lib/common-utils'
import { useNotifications } from '@/providers/notification/NotificationProvider'
import {
  type AppNotification,
  NOTIFICATION_PALETTE,
} from '@/types/notifications.types'
import { Divider } from '../ui/Divider'

export const NotificationRow = ({
  notification,
}: {
  notification: AppNotification
}) => {
  const { dismiss, markRead } = useNotifications()
  const palette = NOTIFICATION_PALETTE[notification.type ?? 'info']

  return (
    <Box
      className={cn(
        'ui-stack rounded-lg border p-3 border-l-4',
        'ui-above-inside gap-1.5',
        !notification.read
      )}
    >
      <Box className='ui-cluster items-center gap-0.5'>
        {notification.sourceType ? (
          <Text className='ui-small-label mr-auto'>
            {
              NOTIFICATION_TYPE_STRINGS[
                notification.sourceType ?? 'announcement'
              ]
            }
          </Text>
        ) : (
          <Text className='ui-body-strong mr-auto'>{notification.title}</Text>
        )}

        {!notification.read && !notification.persistent && (
          <Button
            onClick={() => markRead(notification.id)}
            aria-label={NOTIFICATIONS_STRINGS.markAsRead}
            className='button button-sm ghost p-0.75'
          >
            <Checkmark className='h-5.5 w-5.5 overwrite' />
          </Button>
        )}
        {!notification.persistent && (
          <Button
            onClick={() => dismiss(notification.id)}
            aria-label={NOTIFICATIONS_STRINGS.dismiss}
            className='button button-sm ghost p-0.75'
          >
            <CloseIcon className='h-5.5 w-5.5 overwrite' />
          </Button>
        )}
      </Box>
      <Box className='ui-stack gap-1'>
        {notification.sourceType && (
          <Text className='ui-body-strong mr-auto'>{notification.title}</Text>
        )}
        {notification.body && (
          <Text className='ui-large-caption'>{notification.body}</Text>
        )}
      </Box>

      <Divider className={cn(palette, 'mt-2 cp-divider')} />

      <Box className='ui-cluster justify-between'>
        <Text className='ui-small-label tracking-[.15rem]'>
          {formatDate(notification.createdAt)}
        </Text>
        {notification.action?.kind === 'link' && notification.action.href && (
          <NextLink
            href={notification.action.href}
            onClick={() => markRead(notification.id)}
            className={cn(
              'button button-sm w-fit',
              `${palette}-int`,
              'rounded-lg',
              'py-0.5'
            )}
          >
            {notification.action.label}
          </NextLink>
        )}
      </Box>
    </Box>
  )
}
