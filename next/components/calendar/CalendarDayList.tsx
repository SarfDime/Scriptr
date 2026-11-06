import { CALENDAR_STRINGS } from '@shared/strings/calendar-strings'
import { Box } from '@/components/common/Box'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/common-utils'
import type { CalendarDay } from '@/types/components/Calendar.types'
import { Badge } from '../ui/Badge'
import { Divider } from '../ui/Divider'
import { CalendarDayHeading } from './CalendarDayHeading'
import { CalendarEventDetails } from './CalendarEventDetails'
import { CalendarNoteDayControl } from './CalendarNoteDayControl'

/**
 * Days in order with their events in full — the small-screen form of the month
 * grid, where a seven-column grid of chips would be unusable. Each day also
 * carries its notes and the control that adds one.
 */
export const CalendarDayList = ({
  days,
  className,
}: {
  days: Array<CalendarDay>
  className?: string
}) => (
  <Box as='div' className={cn('ui-stack gap-4', className)}>
    {days.map((day) => (
      <Card
        key={day.key}
        className={cn(
          'p-0 bg-transparent shadow-0 border-0 ring-0 bg-none gap-2'
          // day.isToday && 'border-brand-600'
        )}
      >
        <Card.Header className='ui-cluster justify-between pb-2.5 border-b-0! ring-0'>
          <CalendarDayHeading day={day} />
          <Divider className='flex-1' />
          {day.isToday && (
            <Badge colorPalette='cp-brand'>{CALENDAR_STRINGS.today}</Badge>
          )}
        </Card.Header>
        <Card.Body className='ui-stack gap-2'>
          {day.events.length > 0 && (
            <Box as='ul' className='ui-stack gap-3'>
              {day.events.map((event) => (
                <Box
                  as='li'
                  key={event.id}
                  className='ui-stack gap-1.5 ui-above-inside'
                >
                  <CalendarEventDetails event={event} />
                </Box>
              ))}
            </Box>
          )}
          {/* Notes belong to the day, so an empty one still offers the control
              (and says there is nothing scheduled). */}
          <CalendarNoteDayControl
            day={day.key}
            dayLabel={day.label}
            hasEvents={day.events.length > 0}
          />
        </Card.Body>
      </Card>
    ))}
  </Box>
)
