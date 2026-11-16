'use client'

import {
  CALENDAR_NOTES_AUTO_SYNC_DAYS,
  CALENDAR_NOTES_SYNC_DAILY_LIMIT,
  CALENDAR_NOTES_SYNC_SHORT_LIMIT,
  CALENDAR_NOTES_SYNC_SHORT_MINUTES,
} from '@shared/config/calendar'
import type { LocaleId } from '@shared/config/localization-constants'
import { CALENDAR_STRINGS_PACK } from '@shared/strings/calendar-strings'
import { PREFERENCES_STRINGS_PACK } from '@shared/strings/preferences-strings'
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
import { useLocale } from '@/providers/locale/LocaleProvider'
import { useStrings } from '@/providers/locale/use-strings'
import { useToast } from '@/providers/toaster/ToasterProvider'

/** Formatters per language, built once: a date printed beside a Macedonian
 * sentence should not read `Nov 14, 2026, 10:00`. */
const SYNCED_AT_FORMAT = {
  en: new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }),
  mk: new Intl.DateTimeFormat('mk-MK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }),
} satisfies Record<LocaleId, Intl.DateTimeFormat>

const formatSyncedAt = (value: string, locale: LocaleId) =>
  SYNCED_AT_FORMAT[locale].format(new Date(value))

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
  const strings = useStrings(PREFERENCES_STRINGS_PACK)
  const { locale } = useLocale()
  const calendarStrings = useStrings(CALENDAR_STRINGS_PACK)
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
      addToast({ type: 'success', title: calendarStrings.note.syncToDone })
    }
  }

  const handlePullApply = () => {
    if (!pulled) return
    applyPulledNotes(pulled)
    setPulled(null)
    setMode(null)
    addToast({ type: 'success', title: calendarStrings.note.syncFromDone })
  }

  return (
    <Box className='ui-stack gap-3'>
      <SectionHeader
        title={strings.notes.title}
        subtitle={calendarStrings.note.localNotice}
      />

      <Box className='ui-stack gap-1'>
        <Text className='ui-caption text-fg-muted'>
          {calendarStrings.note.dayCount(liveCount)}
          {lastSyncedAt
            ? ` • ${calendarStrings.note.lastSynced(formatSyncedAt(lastSyncedAt, locale))}`
            : ` • ${calendarStrings.note.neverSynced}`}
        </Text>
        <Text className='ui-caption text-fg-muted'>
          {calendarStrings.note.syncLimitTitle}:{' '}
          {calendarStrings.note.syncLimitShort(
            CALENDAR_NOTES_SYNC_SHORT_LIMIT,
            CALENDAR_NOTES_SYNC_SHORT_MINUTES
          )}
          {' • '}
          {calendarStrings.note.syncLimitDaily(CALENDAR_NOTES_SYNC_DAILY_LIMIT)}
          {` — ${calendarStrings.note.syncLimitNotice}`}
        </Text>
        <Text className='ui-caption text-fg-muted'>
          {calendarStrings.note.autoSyncNotice(CALENDAR_NOTES_AUTO_SYNC_DAYS)}
        </Text>
      </Box>

      <Divider />

      <Box className='ui-cluster gap-2'>
        <Button
          onClick={handlePullRequest}
          isLoading={busy}
          disabled={!signedIn || syncing}
          className='button button-sm subtle'
          aria-label={calendarStrings.note.syncFrom}
        >
          {calendarStrings.note.syncFrom}
        </Button>
        <Button
          onClick={() => setMode('push')}
          disabled={!signedIn || syncing}
          className='button button-sm solid'
          aria-label={calendarStrings.note.syncTo}
        >
          {calendarStrings.note.syncTo}
        </Button>
      </Box>

      {!signedIn && (
        <Text className='ui-caption text-fg-muted'>
          {calendarStrings.note.requiresSignIn}
        </Text>
      )}

      {mode === 'push' && (
        <SyncConfirm
          title={calendarStrings.note.syncToTitle}
          description={calendarStrings.note.syncToDescription}
          confirmLabel={calendarStrings.note.syncTo}
          busy={busy}
          onConfirm={handlePush}
          onClose={() => setMode(null)}
        />
      )}

      {mode === 'pull' && pulled && (
        <SyncConfirm
          title={calendarStrings.note.syncFromTitle}
          description={calendarStrings.note.syncFromDescription}
          warning={
            conflicts ? calendarStrings.note.syncFromConflict(lost) : undefined
          }
          confirmLabel={calendarStrings.note.syncFrom}
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
}: SyncConfirmProps) => {
  const strings = useStrings(PREFERENCES_STRINGS_PACK)

  return (
    <Dialog
      isOpen
      hideTrigger
      title={title}
      onClose={onClose}
      placement='center'
      dialogProps={{
        className: 'md:w-[min(28rem,calc(100vw-2rem))] md:min-w-0',
      }}
    >
      <Card.Body className='ui-stack gap-3 p-4'>
        <Text className='ui-body'>{description}</Text>
        {warning && (
          <Text className='ui-caption cp-warning rounded-lg border p-2'>
            {warning}
          </Text>
        )}
      </Card.Body>
      <DialogFooter
        secondaryLabel={strings.cancel}
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
}
