'use client'

import { CALENDAR_NOTE_SCHEMES } from '@shared/config/calendar'
import { CALENDAR_STRINGS_PACK } from '@shared/strings/calendar-strings'
import type { CalendarNote } from '@shared/types/calendar-notes.types'
import { Text } from '@/components/typography/Text'
import { cn } from '@/lib/common-utils'
import { useStrings } from '@/providers/locale/use-strings'

/**
 * One note as a chip. Its palette comes from the note-type list, which
 * deliberately uses the colours the event types do not, so a note is never
 * mistaken for an event.
 */
export const CalendarNoteChip = ({
  note,
  interactive,
  className,
}: {
  note: CalendarNote
  interactive?: boolean
  className?: string
}) => {
  const strings = useStrings(CALENDAR_STRINGS_PACK)

  return (
    <Text
      as='span'
      className={cn(
        'ui-badge max-w-full min-w-0 gap-1',
        interactive
          ? `${CALENDAR_NOTE_SCHEMES[note.type].chip}-int`
          : CALENDAR_NOTE_SCHEMES[note.type].chip,

        className
      )}
      title={note.title}
    >
      <Text as='span' className='sr-only'>
        {strings.note.type[note.type]}:{' '}
      </Text>
      <Text as='span' className='truncate'>
        {note.title}
      </Text>
    </Text>
  )
}
