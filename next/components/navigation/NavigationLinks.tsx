import CommentIcon from '@sanity/icons/Comment'
import Star from '@sanity/icons/Star'
import { UI_STRINGS } from '@shared/config/strings'
import { cn, generateSlug } from '@/lib/common-utils'
import type { NavItemType } from '@/types/components/Nav.types'
import { Box } from '../common/Box'
import { Button } from '../common/Button'
import { NextImage } from '../common/NextImage'
import { NextLink } from '../common/NextLink'
import { Text } from '../typography/Text'
import { Divider } from '../ui/Divider'

const NavItem = ({ stringTitle, icon, ...rest }: NavItemType) => {
  const slug = generateSlug(rest)
  return (
    <NextLink
      href={slug}
      className={cn(
        'button ghost',
        'w-full justify-start gap-3 p-2.5',
        'text-left text-sm'
      )}
    >
      {icon && <NextImage {...icon} />}
      <Text>{stringTitle}</Text>
    </NextLink>
  )
}

export const NavigationLinks = ({
  navItems,
}: {
  navItems?: Array<NavItemType>
}) => (
  <>
    <Box className='ui-stack gap-0'>
      {navItems?.map((item, index) => (
        <NavItem key={`nav-item-${index}-${item?.stringTitle}`} {...item} />
      ))}
    </Box>
    <Divider />

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
