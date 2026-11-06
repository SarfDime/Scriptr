import { Box } from '@/components/common/Box'
import { Text } from '@/components/typography/Text'
import { cn } from '@/lib/common-utils'
import type { CalendarWeek } from '@/types/components/Calendar.types'
import { CalendarMonthDayCell } from './CalendarMonthDayCell'

type CalendarMonthGridProps = {
  weeks: Array<CalendarWeek>
  weekdayLabels: Array<string>
  className?: string
}

/** Month grid for `md` and up; below it the page shows `CalendarDayList`. */
export const CalendarMonthGrid = ({
  weeks,
  weekdayLabels,
  className,
}: CalendarMonthGridProps) => (
  <Box className={cn('ui-stack gap-2 flex-1', className)}>
    <Box aria-hidden='true' className='grid grid-cols-7 gap-1'>
      {weekdayLabels.map((label) => (
        <Text
          key={label}
          as='span'
          className='ui-label-modern text-center text-fg-muted'
        >
          {label}
        </Text>
      ))}
    </Box>

    <Box as='ol' className='grid grid-cols-7 gap-1.5 grow'>
      {weeks
        .flatMap((week) => week.days)
        .map((day) => (
          <CalendarMonthDayCell key={day.key} day={day} />
        ))}
    </Box>
  </Box>
)
