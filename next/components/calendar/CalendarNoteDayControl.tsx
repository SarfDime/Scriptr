'use client'

import AddIcon from '@sanity/icons/Add'
import { CALENDAR_NOTES_PER_DAY } from '@shared/config/calendar'
import { CALENDAR_STRINGS } from '@shared/strings/calendar-strings'
import type { CalendarNote } from '@shared/types/calendar-notes.types'
import { useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { cn } from '@/lib/common-utils'
import { useCalendarNotes } from '@/providers/calendar-notes/CalendarNotesProvider'
import { CalendarNoteChip } from './CalendarNoteChip'
import { CalendarNoteEditorDialog } from './CalendarNoteEditorDialog'

type CalendarNoteDayControlProps = {
  day: string
  dayLabel: string
  hasEvents: boolean
  /**
   * `row` lists the day's notes and its add button in the flow (a week or
   * agenda row), and a chip opens that note. `cell` is the compact form a month
   * cell uses: the chips are labels only, because the cell itself is a link to
   * the week, and the add button appears on hover or keyboard focus.
   */
  variant?: 'row' | 'cell'
  /** False for a month cell that already links to its week. */
  allowAdd?: boolean
  className?: string
}

/**
 * The notes of one day plus the control that adds one. Client island: notes
 * live in the browser, so only this leaf needs the store.
 */
export const CalendarNoteDayControl = ({
  day,
  dayLabel,
  variant = 'row',
  allowAdd = true,
  hasEvents,
  className,
}: CalendarNoteDayControlProps) => {
  const { ready, notesForDay, canAddNote } = useCalendarNotes()
  const [editing, setEditing] = useState<CalendarNote | 'new' | null>(null)
  const notes = ready ? notesForDay(day) : []
  const isCell = variant === 'cell'
  const canAdd = allowAdd && ready && notes.length < CALENDAR_NOTES_PER_DAY
  const atCap = !canAddNote(day)

  return (
    <Box className={cn('min-w-0', className)}>
      {notes.length > 0 && (
        <Box
          as='ul'
          aria-label={CALENDAR_STRINGS.note.dayCount(notes.length)}
          className='flex min-w-0 flex-wrap gap-1'
        >
          {notes.map((note) => (
            <Box as='li' key={note.id} className='min-w-0'>
              {isCell && hasEvents ? (
                <CalendarNoteChip note={note} />
              ) : (
                <Button
                  onClick={() => setEditing(note)}
                  className='p-0 min-w-0 text-left'
                  aria-label={`${CALENDAR_STRINGS.note.type[note.type]}: ${note.title}`}
                >
                  <CalendarNoteChip interactive note={note} />
                </Button>
              )}
            </Box>
          ))}
        </Box>
      )}

      {canAdd && (
        <Button
          onClick={() => setEditing('new')}
          disabled={atCap}
          aria-label={CALENDAR_STRINGS.note.addOnDay(dayLabel)}
          className={cn(
            'button ghost button-sm mt-1 gap-1',
            isCell &&
              // A month cell is a date, not a stack of controls, and the grid
              // has 42 of them; the button waits for hover or focus.
              'pointer-events-none opacity-0 transition-opacity group-hover/cell:pointer-events-auto group-hover/cell:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100'
          )}
        >
          <AddIcon aria-hidden='true' className='size-4 overwrite' />
          <Text as='span' className='ui-caption'>
            {CALENDAR_STRINGS.note.add}
          </Text>
        </Button>
      )}

      {editing !== null && (
        <CalendarNoteEditorDialog
          day={day}
          dayLabel={dayLabel}
          note={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </Box>
  )
}
