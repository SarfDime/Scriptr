'use client'

import NoteIcon from '@sanity/icons/Edit'
import { CALENDAR_NOTE_SCHEMES } from '@shared/config/calendar'
import { CALENDAR_STRINGS_PACK } from '@shared/strings/calendar-strings'
import type { CalendarNote } from '@shared/types/calendar-notes.types'
import { useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { Popover } from '@/components/ui/Popover'
import { formatCalendarDateShort, formatCalendarDay } from '@/lib/calendar'
import { cn } from '@/lib/common-utils'
import { useCalendarNotes } from '@/providers/calendar-notes/CalendarNotesProvider'
import { useLocale } from '@/providers/locale/LocaleProvider'
import { useStrings } from '@/providers/locale/use-strings'
import { CalendarNoteEditorDialog } from './CalendarNoteEditorDialog'

/**
 * The toolbar's notes button: a scrollable list of every note the reader has
 * added, newest day first, each row showing the date, the type and a truncated
 * title. Clicking a row opens that note.
 *
 * A panel rather than a dialog so the calendar stays visible behind it, and a
 * client island so the toolbar itself stays a Server Component. The panel is a
 * `Popover` in `click` mode — the shared component owns the open state, the
 * outside press and Escape — so this island only holds what is genuinely its
 * own: which note is being edited.
 */
export const CalendarNotesTimeline = () => {
  const { locale } = useLocale()
  const strings = useStrings(CALENDAR_STRINGS_PACK)
  const { ready, notes } = useCalendarNotes()
  const [editing, setEditing] = useState<CalendarNote | null>(null)

  const live = ready
    ? notes
        .filter((note) => !note.deleted)
        .sort((left, right) => right.day.localeCompare(left.day))
    : []

  return (
    <>
      <Popover
        mode='click'
        placement='right'
        // On a phone the wrapper drops its `relative`, so the panel anchors to
        // the translucent card rather than this button-sized box: it pins to the
        // card's right edge and opens from its own static position, which keeps
        // it on screen whatever the toolbar has wrapped into.
        className='max-sm:static'
        // The panel scrolls rather than the list inside it, so the padding stays
        // put while the notes move; 22rem keeps it clear of the day rows below.
        // `ui-above-inside` with a solid fill because the panel sits over dense
        // text, which read through the translucent surface.
        innerWrapperClass='bg-background-200 rounded-xl p-1.5 max-h-[22rem] overflow-y-auto w-80 max-w-[calc(100vw-2rem)] max-sm:left-0 max-sm:right-0 max-sm:w-auto max-sm:max-w-none shadow-xl border border-background-600'
        trigger={
          <Button
            aria-label={strings.note.openTimeline}
            className='button button-sm subtle gap-1 max-md:px-1.5'
          >
            <NoteIcon className='size-5 overwrite md:size-6' />
            <Text as='span' className='ui-caption max-md:hidden'>
              {strings.note.timelineTitle}
            </Text>
            <Text as='span' className='ui-caption md:hidden'>
              {strings.note.timelineTitleCompact}
            </Text>
          </Button>
        }
      >
        {live.length === 0 ? (
          <Text className='ui-caption text-fg-muted'>
            {strings.note.timelineEmpty}
          </Text>
        ) : (
          <Box as='ul' className='ui-stack gap-1'>
            {live.map((note) => (
              <Box as='li' key={note.id}>
                <Button
                  onClick={() => setEditing(note)}
                  className='button ghost rounded-md w-full flex-wrap justify-between gap-0.5 p-1 px-1.5 text-left bg-background-300/80'
                >
                  <Text as='span' className='ui-small-label text-fg-muted'>
                    {formatCalendarDateShort(note.day, locale)}
                  </Text>
                  <Text
                    as='span'
                    className={cn(
                      'ui-badge',
                      CALENDAR_NOTE_SCHEMES[note.type].chip
                    )}
                  >
                    {strings.note.type[note.type]}
                  </Text>
                  <Text
                    as='span'
                    className='w-full truncate ui-large-caption font-bold'
                  >
                    {note.title}
                  </Text>
                </Button>
              </Box>
            ))}
          </Box>
        )}
      </Popover>

      {editing && (
        <CalendarNoteEditorDialog
          day={editing.day}
          dayLabel={formatCalendarDay(editing.day, locale)}
          note={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}
