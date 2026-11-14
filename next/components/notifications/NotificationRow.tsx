'use client'

import Checkmark from '@sanity/icons/Checkmark'
import CloseIcon from '@sanity/icons/Close'
import { NOTIFICATIONS_STRINGS_PACK } from '@shared/strings/notifications-strings'
import { formatDate } from '@shared/utils/common-utils'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { NextLink } from '@/components/common/NextLink'
import { Text } from '@/components/typography/Text'
import { cn } from '@/lib/common-utils'
import { studyUrlFromPath } from '@/lib/study-origin'
import { useLocale } from '@/providers/locale/LocaleProvider'
import { useStrings } from '@/providers/locale/use-strings'
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
  const { locale } = useLocale()
  const strings = useStrings(NOTIFICATIONS_STRINGS_PACK)
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
            {strings.typeNames[notification.sourceType ?? 'announcement']}
          </Text>
        ) : (
          <Text className='ui-body-strong mr-auto'>{notification.title}</Text>
        )}

        {!notification.read && !notification.persistent && (
          <Button
            onClick={() => markRead(notification.id)}
            aria-label={strings.markAsRead}
            className='button button-sm ghost p-0.75'
          >
            <Checkmark className='h-5.5 w-5.5 overwrite' />
          </Button>
        )}
        {!notification.persistent && (
          <Button
            onClick={() => dismiss(notification.id)}
            aria-label={strings.dismiss}
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
          {formatDate(notification.createdAt, locale)}
        </Text>
        {notification.action?.kind === 'link' && notification.action.href && (
          <NextLink
            href={studyUrlFromPath(notification.action.href, locale)}
            onClick={() => markRead(notification.id)}
            className={cn(
              'button button-sm w-fit',
              `${palette}-int`,
              'rounded-lg',
              'py-0.5'
            )}
          >
            {notification.action.label ?? strings.openTarget}
          </NextLink>
        )}
      </Box>
    </Box>
  )
}
