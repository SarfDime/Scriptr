import AddCircleIcon from '@sanity/icons/AddCircle'
import Bell from '@sanity/icons/Bell'
import BookIcon from '@sanity/icons/Book'
import CommentIcon from '@sanity/icons/Comment'
import HomeIcon from '@sanity/icons/Home'
import Star from '@sanity/icons/Star'
import TextIcon from '@sanity/icons/Text'
import User from '@sanity/icons/User'
import { UI_STRINGS } from '@shared/config/strings'
import { cn } from '@/lib/common-utils'
import { Box } from '../common/Box'
import { Button } from '../common/Button'
import { NextLink } from '../common/NextLink'
import { Text } from '../typography/Text'

const navLinks = [
  { href: '/', label: UI_STRINGS.navigation.home, icon: HomeIcon },
  { href: '/api-test', label: UI_STRINGS.navigation.api, icon: HomeIcon },
  { href: '/auth', label: UI_STRINGS.navigation.auth, icon: HomeIcon },
  { href: '/subjects', label: UI_STRINGS.navigation.subjects, icon: BookIcon },
  { href: '/scripts', label: UI_STRINGS.navigation.scripts, icon: TextIcon },
  {
    href: '/professors',
    label: UI_STRINGS.navigation.professors,
    icon: User,
  },
]

export const NavigationLinks = () => (
  <>
    <Box className='ui-stack gap-0'>
      {navLinks.map(({ label, href, icon: Icon }) => (
        <NextLink
          key={label}
          href={href}
          className={cn(
            'button ghost',
            'w-full justify-start gap-3 p-3',
            'text-left ui-caption'
          )}
        >
          <Icon />
          <Text>{label}</Text>
        </NextLink>
      ))}
    </Box>

    <Box className='ui-stack gap-3'>
      <Text className='ui-label px-3 uppercase tracking-[0.18em]'>
        {UI_STRINGS.navigation.workspace}
      </Text>
      <Box className='ui-stack gap-2.5'>
        <Button
          className={cn(
            'button subtle',
            'w-full justify-start gap-3 px-3 py-2.5',
            'ui-caption'
          )}
        >
          <Star />
          <Text>{UI_STRINGS.navigation.favorites}</Text>
          <span className='ui-caption ml-auto'>3</span>
        </Button>
        <Button
          className={cn(
            'button subtle',
            'w-full justify-start gap-3 px-3 py-2.5',
            'ui-caption'
          )}
        >
          <CommentIcon />
          <Text>{UI_STRINGS.navigation.comments}</Text>
        </Button>
      </Box>
    </Box>
  </>
)

export const HeaderActions = () => (
  <Box className='ml-auto flex items-center gap-2'>
    <Button
      className='button subtle p-2'
      aria-label={UI_STRINGS.navigation.notifications}
    >
      <Bell />
    </Button>
    <Button className='button basic gap-2 border border-grey-300 px-3 py-2 ui-caption'>
      <AddCircleIcon />
      <Text>{UI_STRINGS.navigation.newScript}</Text>
    </Button>
  </Box>
)
