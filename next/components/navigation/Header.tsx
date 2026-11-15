import Menu from '@sanity/icons/Menu'
import { UI_STRINGS_PACK } from '@shared/config/strings'
import { cn } from '@/lib/common-utils'
import { getServerStrings } from '@/lib/server-strings'
import type { CalendarAlertData } from '@/types/components/Calendar.types'
import { Box } from '../common/Box'
import { CalendarAlert } from './CalendarAlert'
import { HeaderActions } from './HeaderActions'
import { HeaderDate } from './HeaderDate'
import { NavLogo } from './NavLogo'
import { NavToggle } from './NavToggle'

/**
 * The header is global chrome: the calendar alert is per study and lives in the
 * study's own frame (`app/(study)/study/[siteSlug]/layout.tsx`), which can read
 * it on the server. The same layout hands down the study's handle so the search
 * bar can search that study's scripts; the header itself never reads a host.
 *
 * A Server Component: the copy is resolved from the route's language here. The
 * clock is the one thing that cannot be — a server render would freeze the date
 * and the academic week on any prerendered page — so it is the `HeaderDate`
 * client leaf. */
export const Header = async ({
  calendarAlert,
  studySiteSlug,
}: {
  calendarAlert?: CalendarAlertData
  studySiteSlug?: string | null
}) => {
  const strings = await getServerStrings(UI_STRINGS_PACK)

  return (
    <header
      className={cn(
        'sticky top-0 z-10 flex h-16 items-center justify-between',
        'ui-above-header ui-sheen-diagonal-inverted gap-2'
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
          aria-label={strings.navigation.openNavigation}
          aria-controls='site-navigation'
        >
          <Menu />
        </NavToggle>
      </Box>

      {/* The calendar sits with the header's own date, not with the account
          actions: it is about the academic calendar those dates come from. */}
      <Box className='ui-cluster min-w-0 gap-2'>
        <HeaderDate />
        {calendarAlert && (
          <CalendarAlert
            className='hidden lg:flex'
            events={calendarAlert.events}
            calendarHref={calendarAlert.calendarHref}
            subjects={calendarAlert.subjects}
          />
        )}
      </Box>
      <NavLogo className='lg:hidden' />
      <HeaderActions studySiteSlug={studySiteSlug}>
        {calendarAlert && (
          <CalendarAlert
            className='lg:hidden'
            events={calendarAlert.events}
            calendarHref={calendarAlert.calendarHref}
            subjects={calendarAlert.subjects}
          />
        )}
      </HeaderActions>
    </header>
  )
}
