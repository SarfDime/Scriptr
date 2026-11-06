'use client'

import {
  CALENDAR_NOTE_BODY_MAX,
  CALENDAR_NOTE_SCHEMES,
  CALENDAR_NOTE_TITLE_MAX,
  CALENDAR_NOTE_TYPES,
  type CalendarNoteType,
  DEFAULT_CALENDAR_NOTE_TYPE,
} from '@shared/config/calendar'
import { UI_STRINGS } from '@shared/config/strings'
import { CALENDAR_STRINGS } from '@shared/strings/calendar-strings'
import type { CalendarNote } from '@shared/types/calendar-notes.types'
import { useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { FormContainer } from '@/components/typography/FormContainer'
import { Text } from '@/components/typography/Text'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { DialogFooter } from '@/components/ui/DialogFooter'
import { cn } from '@/lib/common-utils'
import {
  type CalendarNoteDraft,
  useCalendarNotes,
} from '@/providers/calendar-notes/CalendarNotesProvider'
import { useToast } from '@/providers/toaster/ToasterProvider'

type CalendarNoteEditorDialogProps = {
  day: string
  dayLabel: string
  /** The note being edited, or `null` when adding one. */
  note: CalendarNote | null
  onClose: () => void
}

/**
 * Editor for one note. Adding and editing share it; what differs is whether the
 * draft starts from a stored note and whether a delete is offered. The daily cap
 * is enforced by the provider, so a full day cannot be saved from here either.
 */
export const CalendarNoteEditorDialog = ({
  day,
  dayLabel,
  note,
  onClose,
}: CalendarNoteEditorDialogProps) => {
  const { addNote, updateNote, deleteNote } = useCalendarNotes()
  const { addToast } = useToast()
  const [type, setType] = useState<CalendarNoteType>(
    note?.type ?? DEFAULT_CALENDAR_NOTE_TYPE
  )
  const [title, setTitle] = useState(note?.title ?? '')
  const [body, setBody] = useState(note?.body ?? '')
  const [titleError, setTitleError] = useState(false)

  const handleSave = () => {
    const trimmed = title.trim().slice(0, CALENDAR_NOTE_TITLE_MAX)
    if (!trimmed) {
      setTitleError(true)
      return
    }

    const draft: CalendarNoteDraft = {
      type,
      title: trimmed,
      body: body.trim().slice(0, CALENDAR_NOTE_BODY_MAX) || null,
    }

    if (note) {
      updateNote(note.id, draft)
      addToast({ type: 'success', title: CALENDAR_STRINGS.note.saved })
      onClose()
      return
    }

    // The provider refuses a fourth note on the day and says why.
    if (addNote(day, draft)) {
      addToast({ type: 'success', title: CALENDAR_STRINGS.note.saved })
      onClose()
    }
  }

  const handleDelete = () => {
    if (!note) {
      onClose()
      return
    }
    deleteNote(note.id)
    addToast({ type: 'success', title: CALENDAR_STRINGS.note.deleted })
    onClose()
  }

  return (
    <Dialog
      as='section'
      isOpen
      hideTrigger
      title={CALENDAR_STRINGS.note.editorTitle(dayLabel)}
      onClose={onClose}
      placement='center'
      dialogProps={{
        className: 'md:w-[min(30rem,calc(100vw-2rem))] md:min-w-0',
      }}
    >
      <FormContainer
        onSubmit={(event) => {
          event.preventDefault()
          handleSave()
        }}
      >
        <Card.Body className='ui-stack gap-4 p-4'>
          <Box
            role='group'
            aria-label={CALENDAR_STRINGS.note.typeLabel}
            className='ui-cluster gap-1'
          >
            {CALENDAR_NOTE_TYPES.map((option) => (
              <Button
                key={option}
                onClick={() => setType(option)}
                isActive={type === option}
                className={cn(
                  'button button-sm',
                  CALENDAR_NOTE_SCHEMES[option].chip
                )}
              >
                {CALENDAR_STRINGS.note.type[option]}
              </Button>
            ))}
          </Box>

          <Box className='ui-stack gap-1'>
            <Text as='label' htmlFor={`${day}-note-title`} className='ui-label'>
              {CALENDAR_STRINGS.note.titleLabel}
            </Text>
            <input
              id={`${day}-note-title`}
              value={title}
              maxLength={CALENDAR_NOTE_TITLE_MAX}
              placeholder={CALENDAR_STRINGS.note.titlePlaceholder}
              aria-invalid={titleError}
              onChange={(event) => {
                setTitle(event.target.value)
                setTitleError(false)
              }}
              className='ui-above-inside field-sizing-content h-10 rounded-lg px-2 ring-1 ring-inset ring-background-400 focus-visible:outline-none focus-visible:ring-brand'
            />
          </Box>

          <Box className='ui-stack gap-1'>
            <Text as='label' htmlFor={`${day}-note-body`} className='ui-label'>
              {CALENDAR_STRINGS.note.bodyLabel}
            </Text>
            <textarea
              id={`${day}-note-body`}
              value={body}
              rows={4}
              maxLength={CALENDAR_NOTE_BODY_MAX}
              placeholder={CALENDAR_STRINGS.note.bodyPlaceholder}
              onChange={(event) => setBody(event.target.value)}
              className='ui-above-inside rounded-lg p-2 ring-1 ring-inset ring-background-400 focus-visible:outline-none focus-visible:ring-brand'
            />
          </Box>

          <Text className='ui-caption text-fg-muted'>
            {CALENDAR_STRINGS.note.localNotice}
          </Text>
        </Card.Body>

        <DialogFooter
          secondaryLabel={
            note ? CALENDAR_STRINGS.note.delete : UI_STRINGS.general.cancel
          }
          onSecondary={note ? handleDelete : onClose}
          primaryLabel={CALENDAR_STRINGS.note.save}
          primaryType='submit'
        />
      </FormContainer>
    </Dialog>
  )
}
