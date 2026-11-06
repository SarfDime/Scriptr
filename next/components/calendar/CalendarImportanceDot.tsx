import type { CalendarImportance } from '@shared/config/calendar'

/**
 * Importance never changes a hue — every type keeps its own palette — it only
 * adds emphasis. High importance rings the surface it sits on; a dot marks
 * anything above low.
 */
export const calendarImportanceRing = (importance: CalendarImportance) =>
  importance === 'high' ? 'ring-1 ring-current' : undefined

export const CalendarImportanceDot = ({
  importance,
}: {
  importance: CalendarImportance
}) =>
  importance === 'low' ? null : (
    <span
      aria-hidden='true'
      className='size-1.5 shrink-0 rounded-full bg-current'
    />
  )
