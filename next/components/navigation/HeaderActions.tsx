'use client'

import Bell from '@sanity/icons/Bell'
import SearchIcon from '@sanity/icons/Search'
import { UI_STRINGS } from '@shared/config/strings'
import { SEARCH_PAGE_PATH } from '@/lib/script-search'
import { useNotifications } from '@/providers/notification/NotificationProvider'
import { Box } from '../common/Box'
import { Button } from '../common/Button'
import { NextLink } from '../common/NextLink'
import { Badge } from '../ui/Badge'
import { HeaderProfileLink } from './HeaderProfileLink'

export const HeaderActions = () => {
  const { unreadCount, setTrayOpen } = useNotifications()
  return (
    <Box className='ml-auto flex items-center gap-2'>
      <NextLink
        href={SEARCH_PAGE_PATH}
        aria-label={UI_STRINGS.scripts.search.formAriaLabel}
        className='button ghost p-2'
      >
        <SearchIcon />
      </NextLink>
      <Button
        onClick={() => setTrayOpen(true)}
        aria-label='Open notifications'
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
      <HeaderProfileLink />
      {/* TODO: Decide if want to keep this */}
      {/* <Button className='button button-sm basic gap-2 border border-grey-300 px-3 py-2'>
        <AddCircle />
        <Text>{UI_STRINGS.navigation.newScript}</Text>
      </Button> */}
    </Box>
  )
}
