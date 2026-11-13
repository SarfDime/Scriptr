'use client'

import {
  CALENDAR_NOTES_SYNC_DAILY_LIMIT,
  CALENDAR_NOTES_SYNC_SHORT_LIMIT,
  CALENDAR_NOTES_SYNC_SHORT_MINUTES,
} from '@shared/config/calendar'
import { CALENDAR_STRINGS } from '@shared/strings/calendar-strings'
import { PREFERENCES_STRINGS } from '@shared/strings/preferences-strings'
import type { CalendarNote } from '@shared/types/calendar-notes.types'
import {
  countNotesLostByPull,
  notesDifferFrom,
} from '@shared/utils/calendar-notes.utils'
import { useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Text } from '@/components/typography/Text'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { DialogFooter } from '@/components/ui/DialogFooter'
import { Divider } from '@/components/ui/Divider'
import { useCalendarNotes } from '@/providers/calendar-notes/CalendarNotesProvider'
import { useToast } from '@/providers/toaster/ToasterProvider'

const formatSyncedAt = (value: string) =>
  new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

type SyncMode = 'push' | 'pull'

/**
 * The notes half of Preferences: where the local-first notes reach the profile,
 * in either direction.
 *
 * A pull has to fetch before it can warn — comparing the profile's copy with
 * what is in this browser is the whole point — so "sync from" fetches, then
 * asks. The confirmation says how many local notes the pull would discard when
 * the two copies disagree.
 */
export const CalendarNotesSyncSection = () => {
  const {
    notes,
    signedIn,
    syncing,
    lastSyncedAt,
    pullProfileNotes,
    applyPulledNotes,
    pushNotes,
  } = useCalendarNotes()
  const { addToast } = useToast()
  const [mode, setMode] = useState<SyncMode | null>(null)
  const [pulled, setPulled] = useState<Array<CalendarNote> | null>(null)
  const [busy, setBusy] = useState(false)

  const liveCount = notes.filter((note) => !note.deleted).length
  const conflicts = pulled ? notesDifferFrom(notes, pulled) : false
  const lost = pulled ? countNotesLostByPull(notes, pulled) : 0

  const handlePullRequest = async () => {
    setBusy(true)
    const remote = await pullProfileNotes()
    setBusy(false)
    if (!remote) return
    setPulled(remote)
    setMode('pull')
  }

  const handlePush = async () => {
    setBusy(true)
    const ok = await pushNotes()
    setBusy(false)
    setMode(null)
    if (ok) {
      addToast({ type: 'success', title: CALENDAR_STRINGS.note.syncToDone })
    }
  }

  const handlePullApply = () => {
    if (!pulled) return
    applyPulledNotes(pulled)
    setPulled(null)
    setMode(null)
    addToast({ type: 'success', title: CALENDAR_STRINGS.note.syncFromDone })
  }

  return (
    <Box className='ui-stack gap-3'>
      <SectionHeader
        title={PREFERENCES_STRINGS.notes.title}
        subtitle={CALENDAR_STRINGS.note.localNotice}
      />

      <Box className='ui-stack gap-1'>
        <Text className='ui-caption text-fg-muted'>
          {CALENDAR_STRINGS.note.dayCount(liveCount)}
          {lastSyncedAt
            ? ` • ${CALENDAR_STRINGS.note.lastSynced(formatSyncedAt(lastSyncedAt))}`
            : ` • ${CALENDAR_STRINGS.note.neverSynced}`}
        </Text>
        <Text className='ui-caption text-fg-muted'>
          {CALENDAR_STRINGS.note.syncLimitTitle}:{' '}
          {CALENDAR_STRINGS.note.syncLimitShort(
            CALENDAR_NOTES_SYNC_SHORT_LIMIT,
            CALENDAR_NOTES_SYNC_SHORT_MINUTES
          )}
          {' • '}
          {CALENDAR_STRINGS.note.syncLimitDaily(
            CALENDAR_NOTES_SYNC_DAILY_LIMIT
          )}
          {` — ${CALENDAR_STRINGS.note.syncLimitNotice}`}
        </Text>
      </Box>

      <Divider />

      <Box className='ui-cluster gap-2'>
        <Button
          onClick={handlePullRequest}
          isLoading={busy}
          disabled={!signedIn || syncing}
          className='button button-sm subtle'
          aria-label={CALENDAR_STRINGS.note.syncFrom}
        >
          {CALENDAR_STRINGS.note.syncFrom}
        </Button>
        <Button
          onClick={() => setMode('push')}
          disabled={!signedIn || syncing}
          className='button button-sm solid'
          aria-label={CALENDAR_STRINGS.note.syncTo}
        >
          {CALENDAR_STRINGS.note.syncTo}
        </Button>
      </Box>

      {!signedIn && (
        <Text className='ui-caption text-fg-muted'>
          {CALENDAR_STRINGS.note.requiresSignIn}
        </Text>
      )}

      {mode === 'push' && (
        <SyncConfirm
          title={CALENDAR_STRINGS.note.syncToTitle}
          description={CALENDAR_STRINGS.note.syncToDescription}
          confirmLabel={CALENDAR_STRINGS.note.syncTo}
          busy={busy}
          onConfirm={handlePush}
          onClose={() => setMode(null)}
        />
      )}

      {mode === 'pull' && pulled && (
        <SyncConfirm
          title={CALENDAR_STRINGS.note.syncFromTitle}
          description={CALENDAR_STRINGS.note.syncFromDescription}
          warning={
            conflicts ? CALENDAR_STRINGS.note.syncFromConflict(lost) : undefined
          }
          confirmLabel={CALENDAR_STRINGS.note.syncFrom}
          destructive
          onConfirm={handlePullApply}
          onClose={() => {
            setPulled(null)
            setMode(null)
          }}
        />
      )}
    </Box>
  )
}

type SyncConfirmProps = {
  title: string
  description: string
  /** Shown above the buttons when the action would discard something. */
  warning?: string
  confirmLabel: string
  destructive?: boolean
  busy?: boolean
  onConfirm: () => void
  onClose: () => void
}

const SyncConfirm = ({
  title,
  description,
  warning,
  confirmLabel,
  destructive = false,
  busy = false,
  onConfirm,
  onClose,
}: SyncConfirmProps) => (
  <Dialog
    as='section'
    isOpen
    hideTrigger
    title={title}
    onClose={onClose}
    placement='center'
    dialogProps={{ className: 'md:w-[min(28rem,calc(100vw-2rem))] md:min-w-0' }}
  >
    <Card.Body className='ui-stack gap-3 p-4'>
      <Text className='ui-caption text-fg-muted'>{description}</Text>
      {warning && (
        <Text className='ui-caption cp-warning rounded-lg border p-2'>
          {warning}
        </Text>
      )}
    </Card.Body>
    <DialogFooter
      secondaryLabel={PREFERENCES_STRINGS.cancel}
      onSecondary={onClose}
      primaryLabel={confirmLabel}
      primaryType='button'
      onPrimary={onConfirm}
      primaryLoading={busy}
      destructive={destructive}
      size='sm'
    />
  </Dialog>
)
