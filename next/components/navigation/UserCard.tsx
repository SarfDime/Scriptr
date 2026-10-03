import { Box } from '../common/Box'
import { NextLink } from '../common/NextLink'
import { Text } from '../typography/Text'
import { Avatar } from '../ui/Avatar'

type UserCardProps = {
  name: string
  userRole: string
  avatarUrl?: string
  /** Defaults to the viewer's own profile; a caller rendering this for
   * someone else (not currently done anywhere, but the prop exists so
   * this stays reusable) would pass that user's profile URL instead. */
  href?: string
}

export const UserCard = ({
  name,
  userRole,
  avatarUrl,
  href = '/user',
}: UserCardProps) => (
  <NextLink
    href={href}
    className='button justify-start subtle w-full gap-2 p-2'
  >
    <Avatar
      name={name}
      picture={
        avatarUrl
          ? {
              src: avatarUrl,
              className: 'h-10 w-10 rounded-full shadow-sm',
            }
          : undefined
      }
      initialsIconProps={{
        className: 'h-10 w-10 rounded-full shadow-sm p-0',
      }}
    />
    <Box className='text-left'>
      <Text className='ui-label text-fg-700'>{name}</Text>
      <Text className='ui-caption'>{userRole}</Text>
    </Box>
  </NextLink>
)
