'use client'

import AddCircle from '@sanity/icons/AddCircle'
import Bell from '@sanity/icons/Bell'
import { UI_STRINGS } from '@shared/config/strings'
import { useNotifications } from '@/providers/notification/NotificationProvider'
import { Box } from '../common/Box'
import { Button } from '../common/Button'
import { Text } from '../typography/Text'
import { Badge } from '../ui/Badge'

export const HeaderActions = () => {
  const { unreadCount, setTrayOpen } = useNotifications()
  return (
    <Box className='ml-auto flex items-center gap-2'>
      <Button
        onClick={() => setTrayOpen(true)}
        aria-label='Open notifications'
        className='button ghost relative p-2'
      >
        <Bell />
        {unreadCount > 0 && (
          <Badge className='cp-danger absolute -top-1 -right-1 px-1.5 py-0 text-[10px]'>
            {unreadCount}
          </Badge>
        )}
      </Button>
      <Button className='button basic gap-2 border border-grey-300 px-3 py-2 ui-caption'>
        <AddCircle />
        <Text>{UI_STRINGS.navigation.newScript}</Text>
      </Button>
    </Box>
  )
}
