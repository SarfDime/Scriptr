'use client'

import { CALENDAR_STRINGS_PACK } from '@shared/strings/calendar-strings'
import { Box } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
import { Text } from '@/components/typography/Text'
import { cn } from '@/lib/common-utils'
import { useStrings } from '@/providers/locale/use-strings'
import type { CalendarDay } from '@/types/components/Calendar.types'
import { Divider } from '../ui/Divider'
import { CalendarEventChip } from './CalendarEventChip'
import { CalendarNoteDayControl } from './CalendarNoteDayControl'

/** Chips a cell shows before the rest collapse into a count; the week view it
 * opens is where every event is read in full. */
const MAX_CELL_CHIPS = 3

/**
 * One month-grid cell. A day with events is a link — a transparent overlay, so
 * the chips inside stay plain labels — to the week view with that day as the
 * week's third day. An empty day is not a link, so it can carry the note button
 * that appears on hover (notes are added from the week view once a day has
 * events). The cell is a client component only because of its notes.
 */
export const CalendarMonthDayCell = ({ day }: { day: CalendarDay }) => {
  const strings = useStrings(CALENDAR_STRINGS_PACK)
  const hasEvents = day.events.length > 0
  const hiddenChips = day.events.length - MAX_CELL_CHIPS

  return (
    <Box
      as='li'
      className={cn(
        'group/cell relative flex min-w-0 flex-col gap-1 p-1.5',
        'ui-above-inside no-gradient transition-colors grow-0',
        hasEvents && 'hover:border-brand-600 focus-within:border-brand-600',
        day.isToday && 'bg-background-100/70'
      )}
    >
      <Text
        as='span'
        aria-hidden='true'
        className={cn(
          'flex px-1.5 gap-2 justify-between items-center text-xs',
          day.isToday ? 'font-semibold text-brand' : 'text-fg-muted'
        )}
      >
        <Text
          as='span'
          className={cn(
            day.isToday && 'border-brand border-b border-r rounded-full px-1'
          )}
        >
          {day.dayOfMonth}
        </Text>
        {hasEvents && (
          <Divider className={cn('cp-divider', day.isToday && 'cp-brand')} />
        )}

        {hasEvents && hiddenChips > 0 && (
          <Text as='span' className='ui-small-label text-fg-muted min-w-max'>
            {strings.moreEvents(hiddenChips)}
          </Text>
        )}
      </Text>

      {hasEvents && (
        <Box as='ul' className='flex min-w-0 flex-col gap-1 px-0.5 pb-0.5'>
          {day.events.slice(0, MAX_CELL_CHIPS).map((event) => (
            <Box as='li' key={event.id} className='min-w-0'>
              <CalendarEventChip event={event} />
            </Box>
          ))}
        </Box>
      )}

      <CalendarNoteDayControl
        day={day.key}
        hasEvents={hasEvents}
        dayLabel={day.label}
        variant='cell'
        allowAdd={!hasEvents}
        className='px-0.5 pb-0.5'
      />

      {hasEvents && (
        <NextLink
          href={day.weekHref}
          aria-label={strings.dayCellLabel(day.label, day.events.length)}
          className='absolute inset-0 rounded-lg'
        />
      )}
    </Box>
  )
}
