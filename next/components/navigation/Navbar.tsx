'use client'

import CloseIcon from '@sanity/icons/Close'
import { UI_STRINGS } from '@shared/config/strings'
import { useState } from 'react'
import { cn } from '@/lib/common-utils'
import type { NavMenuType } from '@/types/components/Nav.types'
import { Box } from '../common/Box'
import { Button } from '../common/Button'
import { NextLink } from '../common/NextLink'
import { Divider } from '../ui/Divider'
import { ThemeToggle } from '../ui/ThemeToggle'
import { NavigationLinks } from './NavigationLinks'
import { defaultUser, UserCard } from './UserCard'

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

      <Box className='ui-stack gap-0'>
        <NavigationLinks navItems={navItems} />
      </Box>

      <Divider />

      <Box className='ui-stack mt-auto gap-3'>
        <ThemeToggle className='w-full flex-row' />
        <Divider />
        <UserCard name={defaultUser.name} userRole={defaultUser.role} />
      </Box>
    </nav>
  )
}
