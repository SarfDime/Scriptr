import CloseIcon from '@sanity/icons/Close'
import { UI_STRINGS } from '@shared/config/strings'
import { cn } from '@/lib/common-utils'
import type { NavMenuType } from '@/types/components/Nav.types'
import { Box } from '../common/Box'
import { Divider } from '../ui/Divider'
import { SimpleModeToggle } from '../ui/SimpleModeToggle'
import { ThemeToggle } from '../ui/ThemeToggle'
import { AdminNavLink } from './AdminNavLink'
import { NavFavorites } from './NavFavorites'
import { NavigationLinks } from './NavigationLinks'
import { NavLogo } from './NavLogo'
import { NavToggle } from './NavToggle'
import { NavUserSlot } from './NavUserSlot'

/**
 * Server Component. Visibility is driven by the `data-nav-*` attributes that
 * NavProvider sets on its wrapper (read here through the `group/nav`
 * variants): off-canvas below `lg` unless opened, docked from `lg` up unless
 * collapsed. Hidden states are also `invisible` so the links leave the tab
 * order.
 */
export const NavBar = ({ navItems }: NavMenuType) => (
  <>
    <NavToggle
      action='close'
      tabIndex={-1}
      aria-label={UI_STRINGS.navigation.closeNavigation}
      className={cn(
        'fixed inset-0 z-15 bg-background-200/70 backdrop-blur-sm',
        'hidden max-lg:group-data-[nav-open=true]/nav:block'
      )}
    />
    <nav
      id='site-navigation'
      aria-label={UI_STRINGS.navigation.mainNavigation}
      className={cn(
        'fixed inset-y-0 left-0 z-20 w-(--nav-width)',
        'ui-stack p-2.5 pt-0',
        'ui-above-nav gap-3',
        'transition-[translate,visibility] duration-300',
        'max-lg:invisible max-lg:-translate-x-full',
        'max-lg:group-data-[nav-open=true]/nav:visible',
        'max-lg:group-data-[nav-open=true]/nav:translate-x-0',
        'lg:group-data-[nav-collapsed=true]/nav:invisible',
        'lg:group-data-[nav-collapsed=true]/nav:-translate-x-full'
      )}
    >
      <Box className='ui-cluster justify-between h-16 px-3 border-b border-grey-300'>
        <NavLogo />
        <NavToggle
          action='close'
          aria-label={UI_STRINGS.navigation.closeNavigation}
        >
          <CloseIcon />
        </NavToggle>
      </Box>

      <NavigationLinks navItems={navItems} />

      <Divider />

      <NavFavorites />

      <Box className='ui-stack mt-auto gap-3'>
        <ThemeToggle className='w-full flex-row' />
        <Box className='ui-cluster flex-nowrap gap-2'>
          <SimpleModeToggle className='min-w-0 flex-1' />
          <AdminNavLink />
        </Box>
        <Divider />
        <NavUserSlot />
      </Box>
    </nav>
  </>
)
