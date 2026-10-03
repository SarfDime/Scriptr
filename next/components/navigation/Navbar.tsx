'use client'

import CloseIcon from '@sanity/icons/Close'
import { UI_STRINGS } from '@shared/config/strings'
import { useState } from 'react'
import { cn } from '@/lib/common-utils'
import { getDisplayName } from '@/lib/profile-display'
import { useMyProfile } from '@/providers/ProfileProvider'
import { useSession } from '@/providers/SessionProvider'
import type { NavMenuType } from '@/types/components/Nav.types'
import { LogoutButton } from '../auth/LogoutButton'
import { Box } from '../common/Box'
import { Button } from '../common/Button'
import { NextLink } from '../common/NextLink'
import { Text } from '../typography/Text'
import { Divider } from '../ui/Divider'
import { Skeleton } from '../ui/skeleton/Skeleton'
import { ThemeToggle } from '../ui/ThemeToggle'
import { NavigationLinks } from './NavigationLinks'
import { UserCard } from './UserCard'

const UserCardSlot = () => {
  const { session } = useSession()
  const profileState = useMyProfile()

  if (session.status === 'unauthenticated') {
    return (
      <NextLink
        href='/auth'
        className='button subtle w-full justify-center gap-2 p-2'
      >
        <Text className='ui-label'>Sign in</Text>
      </NextLink>
    )
  }

  if (session.status === 'authenticated' && profileState.status === 'loaded') {
    const { profile } = profileState
    return (
      <Box className='ui-center gap-2'>
        <UserCard
          name={getDisplayName(profile)}
          userRole={profile.role}
          avatarUrl={profile.avatar_url ?? undefined}
        />
        <Divider orientation='vertical' className='h-[90%] my-auto' />
        <LogoutButton />
      </Box>
    )
  }

  // session.status === 'loading', or authenticated but the profile fetch
  // hasn't resolved yet (profileState.status is 'idle'/'loading'/'error').
  return (
    <Skeleton loading className='h-14 w-full rounded-lg'>
      <Box className='h-14 w-full' />
    </Skeleton>
  )
}

export const NavBar = ({
  navItems,
}: {
  // TODO: Define the prop types for the Navbar component if needed
} & NavMenuType) => {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav
      className={cn(
        'fixed inset-y-0 left-0 z-20 w-(--nav-width)',
        'ui-stack gap-5 p-2.5 pt-0',
        'border-r ui-above',
        'transition-transform duration-300 lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <Box className='ui-cluster items-center justify-between h-16 px-3 border-b border-grey-300'>
        <NextLink
          href='/'
          className='ui-title font-black font-olive tracking-tighter leading-3'
        >
          Scriptr<span className='text-brand'>.</span>
        </NextLink>
        <Button
          className='button subtle p-2 lg:hidden'
          onClick={() => setMobileOpen(false)}
          aria-label={UI_STRINGS.navigation.closeNavigation}
        >
          <CloseIcon />
        </Button>
      </Box>

      <Box className='ui-stack gap-3'>
        <NavigationLinks navItems={navItems} />
      </Box>

      <Divider />

      <Box className='ui-stack mt-auto gap-3'>
        <ThemeToggle className='w-full flex-row' />
        <Divider />
        <UserCardSlot />
      </Box>
    </nav>
  )
}
