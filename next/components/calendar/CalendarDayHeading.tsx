import { Title } from '@/components/typography/Title'
import type { CalendarDay } from '@/types/components/Calendar.types'

/**
 * The heading of one day in the week view and the small-screen agenda. A phone
 * gets the abbreviated date, where the heading shares its row with the day's
 * notes control; from `md` up there is room for the full one.
 */
export const CalendarDayHeading = ({ day }: { day: CalendarDay }) => (
  <Title as='h3' className='ui-small-label md:ui-label-modern'>
    <span className='md:hidden'>{day.shortLabel}</span>
    <span className='max-md:hidden'>{day.label}</span>
  </Title>
)
