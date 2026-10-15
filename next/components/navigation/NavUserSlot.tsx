'use client'

import User from '@sanity/icons/User'
import { UI_STRINGS } from '@shared/config/strings'
import { getDisplayName } from '@/lib/profile-display'
import { useMyProfile } from '@/providers/ProfileProvider'
import { useSession } from '@/providers/SessionProvider'
import { LogoutButton } from '../auth/LogoutButton'
import { Box } from '../common/Box'
import { NextLink } from '../common/NextLink'
import { Text } from '../typography/Text'
import { Divider } from '../ui/Divider'
import { Skeleton } from '../ui/skeleton/Skeleton'
import { UserCard } from './UserCard'

/** Session-dependent footer of the navbar: sign-in link or the user card. */
export const NavUserSlot = () => {
  const { session } = useSession()
  const profileState = useMyProfile()

  if (session.status === 'unauthenticated') {
    return (
      <NextLink href='/auth' className='button subtle w-full rounded-lg'>
        <User />
        <Text className='ui-label'>Sign in</Text>
      </NextLink>
    )
  }

  if (session.status === 'authenticated') {
    const profile =
      profileState.status === 'loaded' ? profileState.profile : null
    return (
      <Box className='ui-center gap-2'>
        <UserCard
          name={
            profile
              ? getDisplayName(profile)
              : (session.user.username ??
                session.user.email ??
                UI_STRINGS.navigation.account)
          }
          avatarUrl={profile?.avatar_url ?? undefined}
        />
        <Divider orientation='vertical' className='h-[90%] my-auto' />
        <LogoutButton />
      </Box>
    )
  }

  // The session request has not resolved yet.
  return (
    <Skeleton loading className='h-14 w-full rounded-lg'>
      <Box className='h-14 w-full' />
    </Skeleton>
  )
}
