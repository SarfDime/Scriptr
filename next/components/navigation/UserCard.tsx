import EllipsisVertical from '@sanity/icons/EllipsisVertical'
import { Box } from '../common/Box'
import { NextImage } from '../common/NextImage'
import { NextLink } from '../common/NextLink'
import { Text } from '../typography/Text'

const UserAvatar = () => (
  <NextImage
    fillProp
    className='h-10 w-10 rounded-full bg-background-100 shadow-mdx'
    src='https://cdn.sanity.io/images/REDACTED_SANITY_PROJECT_ID/production/6bd637dd69d887c12f8b7b73d296b8c0b05da976-1200x1600.jpg'
  />
)

export const UserCard = ({
  name,
  userRole,
}: {
  name: string
  userRole: string
}) => (
  <NextLink href={'/user'} className='button subtle w-full gap-3 p-2'>
    <UserAvatar />
    <Box className='text-left'>
      <Text className='ui-label text-fg-700'>{name}</Text>
      <Text className='ui-caption'>{userRole}</Text>
    </Box>
    <EllipsisVertical className='ml-auto text-fg-400' />
  </NextLink>
)

export const defaultUser = {
  name: 'Nora Collins',
  role: 'Student',
} as const
