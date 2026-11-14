'use client'

import Bell from '@sanity/icons/Bell'
import { NOTIFICATIONS_STRINGS_PACK } from '@shared/strings/notifications-strings'
import { useStrings } from '@/providers/locale/use-strings'
import { useNotifications } from '@/providers/notification/NotificationProvider'
import { Box } from '../common/Box'
import { Button } from '../common/Button'
import { Badge } from '../ui/Badge'
import { HeaderProfileLink } from './HeaderProfileLink'
import { HeaderSearch } from './HeaderSearch'

export const HeaderActions = ({ children }: { children?: React.ReactNode }) => {
  const { unreadCount, setTrayOpen } = useNotifications()
  const strings = useStrings(NOTIFICATIONS_STRINGS_PACK)
  return (
    <Box className='ml-auto flex items-center gap-2'>
      <HeaderSearch />
      <Button
        onClick={() => setTrayOpen(true)}
        aria-label={strings.openNotifications}
        className='button ghost relative p-2'
      >
        <Bell />
        {unreadCount > 0 && (
          <Badge
            className='absolute top-1 right-1 px-1.5 py-0 text-[10px]'
            colorPalette='cp-danger'
          >
            {unreadCount}
          </Badge>
        )}
      </Button>
      {children}
      <HeaderProfileLink />
    </Box>
  )
}
