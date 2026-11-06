import { CALENDAR_TYPE_SCHEMES } from '@shared/config/calendar'
import { Text } from '@/components/typography/Text'
import { cn } from '@/lib/common-utils'
import type { CalendarEventViewModel } from '@/types/components/Calendar.types'
import {
  CalendarImportanceDot,
  calendarImportanceRing,
} from './CalendarImportanceDot'

/**
 * One event inside a month cell: a label, not a link. The cell itself is the
 * click target that opens the day's events in full, and the subject and
 * professor links live in that panel — so a chip never navigates away.
 */
export const CalendarEventChip = ({
  event,
}: {
  event: CalendarEventViewModel
}) => {
  const scheme = CALENDAR_TYPE_SCHEMES[event.type]

  return (
    <Text
      as='span'
      className={cn(
        'ui-badge max-w-full min-w-0 gap-1',
        scheme.chip,
        calendarImportanceRing(event.importance)
      )}
    >
      <CalendarImportanceDot importance={event.importance} />
      <span className='truncate'>{event.title}</span>
    </Text>
  )
}
