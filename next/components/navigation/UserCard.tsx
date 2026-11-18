'use client'

import { localizedPath } from '@shared/utils/localized-path'
import { cn } from '@/lib/common-utils'
import { useLocale } from '@/providers/locale/LocaleProvider'
import { Box } from '../common/Box'
import { NextLink } from '../common/NextLink'
import { Text } from '../typography/Text'
import { Avatar } from '../ui/Avatar'

type UserCardProps = {
  name: string
  userRole?: string
  avatarUrl?: string
  /** Defaults to the viewer's own profile; a caller rendering this for
   * someone else (not currently done anywhere, but the prop exists so
   * this stays reusable) would pass that user's profile URL instead. */
  href?: string
  restricted?: boolean
}

export const UserCard = ({
  name,
  userRole,
  avatarUrl,
  href,
  restricted = false,
}: UserCardProps) => {
  const { locale } = useLocale()

  return (
    <NextLink
      href={href ?? localizedPath('/user', locale)}
      className={cn(
        'button justify-start w-full gap-2 p-2 grow h-full',
        restricted ? 'danger' : 'subtle'
      )}
    >
      <Avatar
        className='shrink-0'
        name={name}
        picture={
          avatarUrl
            ? {
                src: avatarUrl,
                className: 'h-6 w-6 rounded-full shadow-sm',
              }
            : undefined
        }
        initialsIconProps={{
          className: 'h-6 w-6 rounded-full shadow-sm',
        }}
      />
      <Box className='min-w-0 flex-1 text-left'>
        <Text
          className={cn(
            'ui-label block truncate',
            !restricted && 'text-fg-700'
          )}
        >
          {name}
        </Text>
        {userRole && (
          <Text className='ui-caption block truncate'>{userRole}</Text>
        )}
      </Box>
    </NextLink>
  )
}
