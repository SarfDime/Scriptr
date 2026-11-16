import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { CalendarNote } from '../../../shared/types/calendar-notes.types'
import {
  exceedsDailyNoteCap,
  exceedsProfileNoteCap,
  isCalendarNotesAutoSyncDue,
  nextCalendarNotesAutoSyncAt,
  readCalendarNotesSyncPayload,
  takeCalendarNotesSyncSlot,
} from './calendar-notes'

const STUDY = '11111111-1111-4111-8111-111111111111'
const OTHER_STUDY = '22222222-2222-4222-8222-222222222222'

const note = (overrides: Partial<CalendarNote> = {}): CalendarNote => ({
  id: 'n1',
  studyId: STUDY,
  day: '2026-11-06',
  type: 'note',
  title: 'Read chapter 4',
  body: null,
  updatedAt: '2026-11-01T10:00:00.000Z',
  deleted: false,
  ...overrides,
})

describe('readCalendarNotesSyncPayload', () => {
  it('accepts a list and keeps a usable `since`', () => {
    const payload = readCalendarNotesSyncPayload({
      since: '2026-11-01T10:00:00.000Z',
      notes: [note()],
    })

    assert.equal(payload?.since, '2026-11-01T10:00:00.000Z')
    assert.equal(payload?.notes.length, 1)
  })

  it('treats a missing or broken `since` as a first sync', () => {
    assert.equal(readCalendarNotesSyncPayload({ notes: [] })?.since, null)
    assert.equal(
      readCalendarNotesSyncPayload({ since: 'soon', notes: [] })?.since,
      null
    )
  })

  it('refuses a body that is not a list', () => {
    assert.equal(readCalendarNotesSyncPayload({ notes: 'all' }), null)
    assert.equal(readCalendarNotesSyncPayload({}), null)
  })

  it('refuses a payload whose notes all fail validation', () => {
    assert.equal(
      readCalendarNotesSyncPayload({ notes: [{ id: '', title: '' }] }),
      null
    )
  })

  it('drops the invalid notes of an otherwise usable payload', () => {
    const payload = readCalendarNotesSyncPayload({
      notes: [note(), { id: 'broken' }],
    })

    assert.equal(payload?.notes.length, 1)
  })
})

describe('exceedsDailyNoteCap', () => {
  it('allows three live notes on a day and no more', () => {
    const three = [note({ id: 'a' }), note({ id: 'b' }), note({ id: 'c' })]
    assert.equal(exceedsDailyNoteCap(three), false)
    assert.equal(exceedsDailyNoteCap([...three, note({ id: 'd' })]), true)
  })

  it('counts each study separately, so two calendars can share a day', () => {
    assert.equal(
      exceedsDailyNoteCap([
        note({ id: 'a' }),
        note({ id: 'b' }),
        note({ id: 'c' }),
        note({ id: 'd', studyId: OTHER_STUDY }),
      ]),
      false
    )
  })

  it('does not count tombstones, which are what free a slot', () => {
    assert.equal(
      exceedsDailyNoteCap([
        note({ id: 'a' }),
        note({ id: 'b' }),
        note({ id: 'c' }),
        note({ id: 'd', deleted: true }),
      ]),
      false
    )
  })
})

describe('exceedsProfileNoteCap', () => {
  it('passes a small profile and fails a huge one', () => {
    assert.equal(exceedsProfileNoteCap([note()]), false)
    assert.equal(
      exceedsProfileNoteCap(
        Array.from({ length: 501 }, (_, index) =>
          note({ id: `n${index}`, day: '2026-11-06' })
        )
      ),
      true
    )
  })
})

describe('takeCalendarNotesSyncSlot', () => {
  it('allows three syncs and refuses the fourth within the window', () => {
    const profileId = 'profile-short-window'
    assert.equal(takeCalendarNotesSyncSlot(profileId), null)
    assert.equal(takeCalendarNotesSyncSlot(profileId), null)
    assert.equal(takeCalendarNotesSyncSlot(profileId), null)
    assert.equal(takeCalendarNotesSyncSlot(profileId), 'halfHour')
  })

  it('keeps separate buckets per profile', () => {
    const first = 'profile-a'
    const second = 'profile-b'
    takeCalendarNotesSyncSlot(first)
    takeCalendarNotesSyncSlot(first)
    takeCalendarNotesSyncSlot(first)

    assert.equal(takeCalendarNotesSyncSlot(second), null)
  })
})

describe('isCalendarNotesAutoSyncDue', () => {
  const now = Date.parse('2026-11-16T12:00:00.000Z')
  const daysAgo = (days: number) =>
    new Date(now - days * 24 * 60 * 60 * 1000).toISOString()

  it('is due without a record, or with one a week old', () => {
    assert.equal(isCalendarNotesAutoSyncDue(null, now), true)
    assert.equal(isCalendarNotesAutoSyncDue(daysAgo(7), now), true)
    assert.equal(isCalendarNotesAutoSyncDue(daysAgo(30), now), true)
  })

  it('is not due inside the week, an hour short of it included', () => {
    assert.equal(isCalendarNotesAutoSyncDue(daysAgo(6), now), false)
    assert.equal(
      isCalendarNotesAutoSyncDue(
        new Date(now - 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
        now
      ),
      false
    )
  })

  it('treats an unreadable record as due, so a bad row cannot strand a profile', () => {
    assert.equal(isCalendarNotesAutoSyncDue('not a date', now), true)
  })
})

describe('nextCalendarNotesAutoSyncAt', () => {
  it('adds the week to the last automatic push', () => {
    assert.equal(
      nextCalendarNotesAutoSyncAt('2026-11-10T09:30:00.000Z'),
      '2026-11-17T09:30:00.000Z'
    )
  })

  it('answers now when there is nothing usable to read', () => {
    const before = Date.now()
    const next = Date.parse(nextCalendarNotesAutoSyncAt(null))
    assert.ok(next >= before && next <= Date.now())
  })
})
