import CloseIcon from '@sanity/icons/Close'
import { UI_STRINGS_PACK } from '@shared/config/strings'
import { cn } from '@/lib/common-utils'
import { getServerStrings } from '@/lib/server-strings'
import type { NavBarProps } from '@/types/components/Nav.types'
import { Box } from '../common/Box'
import { LanguageToggle } from '../locale/LanguageToggle'
import { Divider } from '../ui/Divider'
import { SimpleModeToggle } from '../ui/SimpleModeToggle'
import { ThemeToggle } from '../ui/ThemeToggle'
import { AdminNavLink } from './AdminNavLink'
import { NavFavorites } from './NavFavorites'
import { NavigationLinks } from './NavigationLinks'
import { NavLogo } from './NavLogo'
import { NavStudies } from './NavStudies'
import { NavStudyTip } from './NavStudyTip'
import { NavToggle } from './NavToggle'
import { NavUserSlot } from './NavUserSlot'

/**
 * Server Component. Visibility is driven by the `data-nav-*` attributes that
 * NavProvider sets on its wrapper (read here through the `group/nav`
 * variants): off-canvas below `lg` unless opened, docked from `lg` up unless
 * collapsed. Hidden states are also `invisible` so the links leave the tab
 * order.
 */
export const NavBar = async ({
  navItems,
  studyLogos,
  studyTips,
}: NavBarProps) => {
  const strings = await getServerStrings(UI_STRINGS_PACK)

  return (
    <>
      <NavToggle
        action='close'
        tabIndex={-1}
        aria-label={strings.navigation.closeNavigation}
        className={cn(
          'fixed inset-0 z-15 bg-background-200/85',
          'hidden max-xl:group-data-[nav-open=true]/nav:block'
        )}
      />
      <nav
        id='site-navigation'
        aria-label={strings.navigation.mainNavigation}
        className={cn(
          'fixed inset-y-0 left-0 z-20 w-(--nav-width)',
          'ui-stack p-2.5 pt-0',
          'ui-above-nav gap-3',
          'transition-[translate,visibility] duration-300',
          'max-xl:invisible max-xl:-translate-x-full',
          'max-xl:group-data-[nav-open=true]/nav:visible',
          'max-xl:group-data-[nav-open=true]/nav:translate-x-0',
          'xl:group-data-[nav-collapsed=true]/nav:invisible',
          'xl:group-data-[nav-collapsed=true]/nav:-translate-x-full'
        )}
      >
        <Box className='ui-cluster justify-between h-(--header-height) px-3 ui-groove-b'>
          <NavLogo />
          <NavToggle
            action='close'
            aria-label={strings.navigation.closeNavigation}
          >
            <CloseIcon />
          </NavToggle>
        </Box>

        {navItems && (
          <>
            <NavigationLinks navItems={navItems} /> <Divider />
          </>
        )}

        <NavStudies studyLogos={studyLogos} />

        <NavFavorites />

        {studyTips && studyTips.length > 0 && <NavStudyTip tips={studyTips} />}

        <Box className={cn('ui-stack gap-3', !studyTips?.length && 'mt-auto')}>
          <Divider />
          <ThemeToggle className='w-full flex-row' />
          <LanguageToggle className='w-full flex-row' />
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
}
