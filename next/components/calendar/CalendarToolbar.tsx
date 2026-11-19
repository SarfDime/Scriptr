import Calendar from '@sanity/icons/Calendar'
import DoubleChevronDown from '@sanity/icons/DoubleChevronDown'
import DoubleChevronLeft from '@sanity/icons/DoubleChevronLeft'
import DoubleChevronRight from '@sanity/icons/DoubleChevronRight'
import { NumberIcon } from '@sanity/icons/Number'
import { CALENDAR_STRINGS_PACK } from '@shared/strings/calendar-strings'
import { Box } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
import { Title } from '@/components/typography/Title'
import { cn } from '@/lib/common-utils'
import { getServerStrings } from '@/lib/server-strings'
import type { CalendarPageViewModel } from '@/types/components/Calendar.types'
import { Divider } from '../ui/Divider'
import { CalendarNotesTimeline } from './CalendarNotesTimeline'

type CalendarToolbarProps = Pick<
  CalendarPageViewModel,
  'view' | 'isAtToday' | 'periodLabel' | 'periodLabelShort' | 'links'
>

const ACTION_ICON_CLASS = 'size-5 overwrite md:size-6'

/** Phone-only placement, two rows: the period with its arrows, then the view
 * switch with the actions. Grid placement rather than a second copy of the
 * controls, so each link and the notes island is mounted once; from `md` up the
 * container is a single flex row and these are ignored. */
const PHONE_PERIOD = 'col-start-1 row-start-1'
const PHONE_STEPPER = 'col-start-2 row-start-1 ml-auto'
const PHONE_VIEW = 'col-start-1 row-start-2'
const PHONE_ACTIONS = 'col-start-2 row-start-2 ml-auto md:ml-0'

/** Plain links throughout: the view and the period live in the URL, so the page
 * stays a Server Component and nothing here needs client state. `nofollow`
 * keeps a crawler out of the unbounded chain of periods they form. */
export const CalendarToolbar = async ({
  view,
  isAtToday,
  periodLabel,
  periodLabelShort,
  links,
}: CalendarToolbarProps) => {
  const strings = await getServerStrings(CALENDAR_STRINGS_PACK)

  return (
    <Box
      className={cn(
        'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1.5',
        'md:flex md:flex-nowrap md:items-center md:gap-3'
      )}
    >
      <Box
        role='group'
        aria-label={strings.viewToggleLabel}
        className={cn(PHONE_VIEW, 'ui-cluster flex-nowrap gap-1 min-w-0')}
      >
        <NextLink
          href={links.monthView}
          rel='nofollow'
          aria-current={view === 'month' ? 'page' : undefined}
          disabled={view === 'month' ? true : undefined}
          isActive={view === 'month' ? true : undefined}
          className={cn(
            'button button-sm pl-1 max-md:px-1.5',
            view === 'month' ? 'solid' : 'subtle'
          )}
        >
          <Calendar className={ACTION_ICON_CLASS} />
          {strings.viewMonth}
        </NextLink>
        <NextLink
          href={links.weekView}
          rel='nofollow'
          aria-current={view === 'week' ? 'page' : undefined}
          disabled={view === 'week' ? true : undefined}
          isActive={view === 'week' ? true : undefined}
          className={cn(
            'button button-sm pl-1 max-md:px-1.5',
            view === 'week' ? 'solid' : 'subtle'
          )}
        >
          <NumberIcon className={ACTION_ICON_CLASS} />
          {strings.viewWeek}
        </NextLink>
        <Divider orientation='vertical' className='hidden md:block ml-3 mr-1' />
      </Box>

      {/* Its own child rather than part of the switch group: on a phone it leads
        the first row, above the switch it labels. The first row is shared with
        the arrows, so a phone gets the abbreviated period. */}
      <Title
        as='h2'
        className={cn(
          PHONE_PERIOD,
          'min-w-0 truncate ui-small-label md:ui-label-modern'
        )}
      >
        <span className='md:hidden'>{periodLabelShort}</span>
        <span className='max-md:hidden'>{periodLabel}</span>
      </Title>

      <Box className={cn(PHONE_STEPPER, 'ui-cluster flex-nowrap gap-1')}>
        <NextLink
          href={links.previous}
          rel='nofollow'
          className='button button-sm subtle max-md:p-1.5 md:pl-0'
        >
          <DoubleChevronLeft className={ACTION_ICON_CLASS} />
          <span className='max-md:sr-only'>{strings.previousPeriod}</span>
        </NextLink>
        {/* A disabled button rather than a link back to the page already on
          screen: it says "you are here" instead of offering a no-op. */}
        <NextLink
          href={links.today}
          rel='nofollow'
          isActive={isAtToday}
          disabled={isAtToday}
          className='button button-sm subtle max-md:px-1.5 md:px-0'
        >
          <DoubleChevronDown
            className={cn(ACTION_ICON_CLASS, 'max-md:hidden')}
          />
          {strings.today}
          <DoubleChevronDown
            className={cn(ACTION_ICON_CLASS, 'max-md:hidden')}
          />
        </NextLink>
        <NextLink
          href={links.next}
          rel='nofollow'
          className='button button-sm subtle max-md:p-1.5 md:pr-0'
        >
          <span className='max-md:sr-only'>{strings.nextPeriod}</span>
          <DoubleChevronRight className={ACTION_ICON_CLASS} />
        </NextLink>
      </Box>

      <Divider orientation='vertical' className='hidden md:block ml-1 mr-1' />

      <Box className={PHONE_ACTIONS}>
        <CalendarNotesTimeline />
      </Box>
    </Box>
  )
}
