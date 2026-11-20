import Menu from '@sanity/icons/Menu'
import { UI_STRINGS_PACK } from '@shared/config/strings'
import { Suspense } from 'react'
import { cn } from '@/lib/common-utils'
import { getPrerenderNow } from '@/lib/prerender-clock'
import { getServerStrings } from '@/lib/server-strings'
import { Box } from '../common/Box'
import { HeaderActions } from './HeaderActions'
import { HeaderDate } from './HeaderDate'
import { HeaderSearch } from './HeaderSearch'
import { NavLogo } from './NavLogo'
import { NavToggle } from './NavToggle'
import {
  StudyCalendarAlert,
  StudySearch,
  type StudySiteParams,
} from './StudyChrome'

/**
 * The header is global chrome: the calendar alert is per study and the search
 * bar searches a study's own scripts. Both get the study's handle from the
 * study tree's layout (`app/(study)/study/[siteSlug]/layout.tsx`); the header
 * itself never reads a host.
 *
 * A Server Component: the copy is resolved from the route's language here. The
 * clock is the one thing that cannot be — a server render would freeze the date
 * and the academic week on any prerendered page — so it is the `HeaderDate`
 * client leaf.
 *
 * A study passes its handle as a promise, not a value: the two parts of the
 * header that need it (the calendar alert and the search scope) are leaves
 * inside their own boundaries, so the layout above them stays prerenderable.
 * Only those two leaves are deferred — the notification bell and the profile
 * link read client stores and must hydrate with the first pass. */
export const Header = async ({
  studySiteParams,
}: {
  studySiteParams?: StudySiteParams
}) => {
  const [strings, prerenderNow] = await Promise.all([
    getServerStrings(UI_STRINGS_PACK),
    getPrerenderNow(),
  ])

  return (
    <header
      className={cn(
        'sticky top-0 z-10 flex h-(--header-height) shrink-0 items-center justify-between',
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
        <HeaderDate initialNow={prerenderNow} />
        {studySiteParams && (
          <Suspense fallback={null}>
            <StudyCalendarAlert
              params={studySiteParams}
              className='hidden lg:flex'
            />
          </Suspense>
        )}
      </Box>
      <NavLogo className='lg:hidden' />
      <HeaderActions
        searchScope={
          studySiteParams && (
            <Suspense fallback={<HeaderSearch />}>
              <StudySearch params={studySiteParams} />
            </Suspense>
          )
        }
      >
        {studySiteParams && (
          <Suspense fallback={null}>
            <StudyCalendarAlert
              params={studySiteParams}
              className='lg:hidden'
            />
          </Suspense>
        )}
      </HeaderActions>
    </header>
  )
}
