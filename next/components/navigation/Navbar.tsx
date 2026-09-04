'use client'

import AddCircleIcon from '@sanity/icons/AddCircle'
import Bell from '@sanity/icons/Bell'
import BookIcon from '@sanity/icons/Book'
import CloseIcon from '@sanity/icons/Close'
import CommentIcon from '@sanity/icons/Comment'
import EllipsisVertical from '@sanity/icons/EllipsisVertical'
import HomeIcon from '@sanity/icons/Home'
import Menu from '@sanity/icons/Menu'
import Star from '@sanity/icons/Star'
import TextIcon from '@sanity/icons/Text'
import User from '@sanity/icons/User'
import { useState } from 'react'
import { cn } from '@/lib/common-utils'
import { Box } from '../common/Box'
import { Button } from '../common/Button'
import { NextImage } from '../common/NextImage'
import { NextLink } from '../common/NextLink'
import { Text } from '../typography/Text'
import { Title } from '../typography/Title'
import { Divider } from '../ui/Divider'
import { ThemeToggle } from '../ui/ThemeToggle'

const navLinks = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/api-test', label: 'API', icon: HomeIcon },
  { href: '/auth', label: 'Auth', icon: HomeIcon },
  { href: '/subjects', label: 'Subjects', icon: BookIcon },
  { href: '/scripts', label: 'Scripts', icon: TextIcon },
  { href: '/professors', label: 'Professors', icon: User },
]

export const Header = () => {
  const [_mobileOpen, setMobileOpen] = useState(false)

  return (
    <header
      className={cn(
        'sticky top-0 z-10 flex h-16 items-center justify-between',
        'border-b border-grey-300 bg-background-100/65 backdrop-blur',
        'px-5 lg:px-10'
      )}
    >
      <Button
        className='button subtle p-2 lg:hidden'
        onClick={() => setMobileOpen(true)}
        aria-label='Open navigation'
      >
        <Menu />
      </Button>

      <Text className='hidden text-sm text-fg-400 lg:block'>
        Thursday, September 4 <span className='mx-2 text-grey-400'>/</span> Week
        5
      </Text>

      <Box className='ml-auto flex items-center gap-2'>
        <Button className='button subtle p-2' aria-label='Notifications'>
          <Bell />
        </Button>
        <Button
          className={cn(
            'button basic',
            'gap-2 border border-grey-300 px-3 py-2',
            'text-sm'
          )}
        >
          <AddCircleIcon /> New script
        </Button>
      </Box>
    </header>
  )
}

const UserAvatar = () => {
  return (
    <NextImage
      fillProp
      className='w-10 h-10 rounded-full bg-background-100 shadow-mdx'
      src='https://cdn.sanity.io/images/REDACTED_SANITY_PROJECT_ID/production/6bd637dd69d887c12f8b7b73d296b8c0b05da976-1200x1600.jpg'
    />
  )
}

const UserCard = ({ name, userRole }: { name: string; userRole: string }) => {
  return (
    <Button className='button subtle p-2 gap-3 w-full'>
      <UserAvatar />
      <Box className='text-left'>
        <Text className='text-sm text-fg-700'>{name}</Text>
        <Text className='text-xs text-fg-400'>{userRole}</Text>
      </Box>
      <EllipsisVertical className='ml-auto text-fg-400' />
    </Button>
  )
}

export const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav
      className={cn(
        'fixed inset-y-0 left-0 z-20 w-(--nav-width)',
        'ui-stack gap-5 p-2.5 pt-0',
        'border-r border-grey-300 bg-background-100 shadow-mdx',
        'transition-transform duration-300 lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <Box className='ui-cluster items-center justify-between h-16 px-3 border-b border-grey-300'>
        <Title className='text-xl font-black tracking-[-0.06em] text-fg-700'>
          Scriptr<span className='text-brand'>.</span>
        </Title>
        <Button
          className='button subtle p-2 lg:hidden'
          onClick={() => setMobileOpen(false)}
          aria-label='Close navigation'
        >
          <CloseIcon />
        </Button>
      </Box>

      <Box className='ui-stack gap-2'>
        {navLinks.map(({ label, href, icon: Icon }) => (
          <NextLink
            key={label}
            href={href}
            className={cn(
              'button basic',
              'w-full justify-start gap-3 p-3',
              'text-left text-sm'
            )}
          >
            <Icon />
            {label}
          </NextLink>
        ))}
      </Box>

      <Divider />

      <Box className='ui-stack gap-3'>
        <Text className='px-3 text-xs font-medium uppercase tracking-[0.18em] text-fg-400'>
          Workspace
        </Text>
        <Box className='ui-stack gap-2.5'>
          <Button
            className={cn(
              'button subtle',
              'w-full justify-start gap-3 px-3 py-2.5',
              'text-sm'
            )}
          >
            <Star />
            Favorites <span className='ml-auto text-xs text-fg-400'>{3}</span>
          </Button>
          <Button
            className={cn(
              'button subtle',
              'w-full justify-start gap-3 px-3 py-2.5',
              'text-sm'
            )}
          >
            <CommentIcon />
            Comments
          </Button>
        </Box>
      </Box>

      <Box className='ui-stack mt-auto gap-3'>
        <ThemeToggle className='w-full flex-row' />

        <Divider />
        <UserCard name='Nora Collins' userRole='Student' />
      </Box>
    </nav>
  )
}
