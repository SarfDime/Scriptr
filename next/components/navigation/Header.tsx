'use client'

import Menu from '@sanity/icons/Menu'
import type { LocaleId } from '@shared/config/localization-constants'
import { cn } from '@/lib/common-utils'
import { useLocale } from '@/providers/locale/LocaleProvider'
import { useUIStrings } from '@/providers/locale/use-strings'
import type { CalendarAlertData } from '@/types/components/Calendar.types'
import { Box } from '../common/Box'
import { Text } from '../typography/Text'
import { CalendarAlert } from './CalendarAlert'
import { HeaderActions } from './HeaderActions'
import { NavLogo } from './NavLogo'
import { NavToggle } from './NavToggle'

/** Built once per language: the date is chrome, so it reads in the same
 * language as the rest of the header. */
const HEADER_DATE_FORMAT = {
  en: new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }),
  mk: new Intl.DateTimeFormat('mk-MK', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }),
} satisfies Record<LocaleId, Intl.DateTimeFormat>

const getHeaderDateLabel = (date: Date, locale: LocaleId) => {
  const dateLabel = HEADER_DATE_FORMAT[locale].format(date)
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

/**
 * The header is global chrome, so it knows nothing about studies: the calendar
 * alert is per study and lives in the study's own frame
 * (`app/(study)/study/[siteSlug]/layout.tsx`), which can read it on the server.
 *
 * A Client Component because `PageLayout` renders it and a client page
 * (`ProfilePage`) imports `PageLayout` — in that graph `next/root-params` has no
 * exports, so `getServerStrings` would fail the build. `useUIStrings()` is the
 * route's language, handed down from the layout.
 */
export const Header = ({
  calendarAlert,
}: {
  calendarAlert?: CalendarAlertData
}) => {
  const { locale } = useLocale()
  const strings = useUIStrings()
  const { dateLabel, week } = getHeaderDateLabel(new Date(), locale)

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
        {/* Suppressed: the label is "now", so a render that straddles midnight
            legitimately differs between the server and the client. */}
        <Text
          className='ui-caption hidden lg:block capitalize'
          suppressHydrationWarning
        >
          {dateLabel} <span className='mx-2 text-grey-400'>/</span>{' '}
          {strings.navigation.week(week)}
        </Text>
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
      <HeaderActions>
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
