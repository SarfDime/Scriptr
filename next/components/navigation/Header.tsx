import Menu from '@sanity/icons/Menu'
import { UI_STRINGS } from '@shared/config/strings'
import { cn } from '@/lib/common-utils'
import { Box } from '../common/Box'
import { Text } from '../typography/Text'
import { HeaderActions } from './HeaderActions'
import { NavLogo } from './NavLogo'
import { NavToggle } from './NavToggle'

const getHeaderDateLabel = (date: Date) => {
  const dateLabel = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date)
  const academicYearStart = new Date(
    date.getFullYear() - (date.getMonth() < 9 ? 1 : 0),
    9,
    1
  )
  const week =
    Math.floor(
      (date.getTime() - academicYearStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
    ) + 1

  return { dateLabel, week }
}

export const Header = () => {
  const { dateLabel, week } = getHeaderDateLabel(new Date())

  return (
    <header
      className={cn(
        'sticky top-0 z-10 flex h-16 items-center justify-between',
        'ui-above-header',
        'px-5'
      )}
    >
      {/* Always available below xl. From xl up it is `display: none` while the
        navbar is docked. `transition-discrete` (allow-discrete) lets `display`
        flip at the end of the width/opacity transition when hiding, and
        `starting:` supplies the from-state when it appears again, so the header
        content slides instead of jumping. */}
      <Box
        className={cn(
          'w-10 shrink-0 opacity-100',
          'transition-[width,opacity,display] transition-discrete duration-300 ease-in-out',
          'starting:w-0 starting:opacity-0',
          'xl:group-data-[nav-collapsed=false]/nav:hidden',
          'xl:group-data-[nav-collapsed=false]/nav:w-0',
          'xl:group-data-[nav-collapsed=false]/nav:opacity-0'
        )}
      >
        <NavToggle
          action='open'
          className='flex items-center justify-center'
          aria-label={UI_STRINGS.navigation.openNavigation}
          aria-controls='site-navigation'
        >
          <Menu />
        </NavToggle>
      </Box>

      <Text className='ui-caption hidden lg:block'>
        {dateLabel} <span className='mx-2 text-grey-400'>/</span> Week {week}
      </Text>
      <NavLogo className='xl:hidden' />
      <HeaderActions />
    </header>
  )
}
