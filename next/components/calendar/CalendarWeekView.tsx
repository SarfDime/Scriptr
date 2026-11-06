import { CALENDAR_STRINGS } from '@shared/strings/calendar-strings'
import { Box } from '@/components/common/Box'
import { Badge } from '@/components/ui/Badge'
import type { CalendarDay } from '@/types/components/Calendar.types'
import { Divider } from '../ui/Divider'
import { CalendarDayHeading } from './CalendarDayHeading'
import { CalendarEventDetails } from './CalendarEventDetails'
import { CalendarNoteDayControl } from './CalendarNoteDayControl'

/** A day with nothing on it stays one compact line, so an empty week does not
 * read as seven empty cards — but it still carries its notes and the add
 * button, because an empty day is exactly where a note gets written. */
const EmptyDay = ({ day }: { day: CalendarDay }) => (
  <Box className='ui-cluster justify-between gap-2 grow'>
    <CalendarDayHeading day={day} />
    <Divider className='cp-divider flex-1' />
    <CalendarNoteDayControl
      day={day.key}
      dayLabel={day.label}
      hasEvents={false}
      className='flex flex-wrap items-center justify-end gap-1'
    />
  </Box>
)

const DayEvents = ({ day }: { day: CalendarDay }) => (
  <Box className='ui-stack gap-2 grow'>
    <Box className='ui-cluster justify-between gap-2'>
      <CalendarDayHeading day={day} />
      <Divider className='cp-divider flex-1' />

      {day.isToday && (
        <Badge
          colorPalette='cp-brand'
          className='pt-0 px-1 md:py-0.5 md:px-1.5'
        >
          {CALENDAR_STRINGS.today}
        </Badge>
      )}
      <CalendarNoteDayControl day={day.key} dayLabel={day.label} hasEvents />
    </Box>
    {/* Cards wrap by available width instead of stacking: a day with several
        events fills the row, and a single event keeps its own card. */}
    <Box className='ui-card-grid grow'>
      {day.events.map((event) => (
        <CalendarEventDetails
          className='ui-above-inside'
          key={event.id}
          event={event}
        />
      ))}
    </Box>
  </Box>
)

/**
 * Week view: the week's days in order, each with its events as cards in a
 * wrapping grid, and empty days collapsed to one line.
 */
export const CalendarWeekView = ({ days }: { days: Array<CalendarDay> }) => (
  <Box className='ui-stack gap-4 grow'>
    {days.map((day) =>
      day.events.length === 0 ? (
        <EmptyDay key={day.key} day={day} />
      ) : (
        <DayEvents key={day.key} day={day} />
      )
    )}
  </Box>
)
