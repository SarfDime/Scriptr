'use client'

import User from '@sanity/icons/User'
import { getDisplayName } from '@/lib/profile-display'
import { catalogUrl } from '@/lib/study-origin'
import { useLocale } from '@/providers/locale/LocaleProvider'
import { useUIStrings } from '@/providers/locale/use-strings'
import { useNotifications } from '@/providers/notification/NotificationProvider'
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
  const strings = useUIStrings()
  const { locale } = useLocale()
  const { session } = useSession()
  const profileState = useMyProfile()
  const { restrictionNotice } = useNotifications()

  if (session.status === 'unauthenticated') {
    return (
      <NextLink
        href={catalogUrl('/auth', locale)}
        className='button subtle w-full rounded-lg'
      >
        <User />
        <Text className='ui-label'>{strings.navigation.signIn}</Text>
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
                strings.navigation.account)
          }
          avatarUrl={profile?.avatar_url ?? undefined}
          restricted={restrictionNotice !== null}
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
