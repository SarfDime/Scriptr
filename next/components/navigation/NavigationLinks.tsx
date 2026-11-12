import { cn, generateSlug } from '@/lib/common-utils'
import { studyUrlFromPath } from '@/lib/study-origin'
import { IMAGE_SIZES } from '@/styles/style'
import type { NavItemType } from '@/types/components/Nav.types'
import { Box } from '../common/Box'
import { NextImage } from '../common/NextImage'
import { NextLink } from '../common/NextLink'
import { Text } from '../typography/Text'

const NavItem = ({ stringTitle, icon, ...rest }: NavItemType) => {
  // A menu item is editorial data: it may point anywhere. A `/study/<handle>`
  // one has to be the study's own address, or the router prefetches it here,
  // the study host answers with a cross-origin redirect, and the fetch is
  // blocked.
  const slug = studyUrlFromPath(generateSlug(rest))
  return (
    <NextLink
      href={slug}
      className={cn(
        'button ghost',
        'w-full justify-start align-left gap-2 p-2'
      )}
    >
      {icon && (
        <NextImage
          {...icon}
          className='w-6 h-6'
          fillProp
          sizes={IMAGE_SIZES.LINK_LOGO}
        />
      )}
      <Text className='ui-large-caption truncate'>{stringTitle}</Text>
    </NextLink>
  )
}

export const NavigationLinks = ({
  navItems,
}: {
  navItems?: Array<NavItemType>
}) => (
  <Box className='ui-stack gap-0'>
    {navItems?.map((item, index) => (
      <NavItem key={`nav-item-${index}-${item?.stringTitle}`} {...item} />
    ))}
  </Box>
)
