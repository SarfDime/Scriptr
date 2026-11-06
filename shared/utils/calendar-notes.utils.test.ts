import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { CALENDAR_NOTE_TITLE_MAX } from '../config/calendar'
import type { CalendarNote } from '../types/calendar-notes.types'
import {
  canAddNoteOnDay,
  countNotesLostByPull,
  countNotesOnDay,
  groupNotesByDay,
  isCalendarDayKey,
  mergeCalendarNotes,
  notesChangedSince,
  notesDifferFrom,
  sanitizeCalendarNote,
  sanitizeCalendarNotes,
} from './calendar-notes.utils'

const note = (overrides: Partial<CalendarNote> = {}): CalendarNote => ({
  id: 'n1',
  day: '2026-11-06',
  type: 'note',
  title: 'Read chapter 4',
  body: null,
  updatedAt: '2026-11-01T10:00:00.000Z',
  deleted: false,
  ...overrides,
})

describe('isCalendarDayKey', () => {
  it('accepts a real day and rejects impossible ones', () => {
    assert.equal(isCalendarDayKey('2026-11-06'), true)
    assert.equal(isCalendarDayKey('2026-02-28'), true)
    assert.equal(isCalendarDayKey('2026-02-30'), false)
    assert.equal(isCalendarDayKey('2026-1-6'), false)
    assert.equal(isCalendarDayKey('06-11-2026'), false)
    assert.equal(isCalendarDayKey(20261106), false)
  })
})

describe('sanitizeCalendarNote', () => {
  it('keeps a valid note and normalises an empty body to null', () => {
    assert.deepEqual(sanitizeCalendarNote(note({ body: '   ' })), note())
  })

  it('drops notes that cannot be used', () => {
    assert.equal(sanitizeCalendarNote(null), null)
    assert.equal(sanitizeCalendarNote(note({ id: '' })), null)
    assert.equal(sanitizeCalendarNote(note({ day: '2026-13-01' })), null)
    assert.equal(sanitizeCalendarNote({ ...note(), type: 'birthday' }), null)
    assert.equal(sanitizeCalendarNote(note({ title: '  ' })), null)
  })

  it('clamps a long title instead of dropping the note', () => {
    const long = sanitizeCalendarNote(note({ title: 'x'.repeat(500) }))
    assert.equal(long?.title.length, CALENDAR_NOTE_TITLE_MAX)
  })

  it('gives a note with a broken timestamp the current one', () => {
    const parsed = sanitizeCalendarNote(note({ updatedAt: 'not a date' }))
    assert.ok(parsed)
    assert.ok(Number.isFinite(Date.parse(parsed.updatedAt)))
  })
})

describe('sanitizeCalendarNotes', () => {
  it('deduplicates by id, last occurrence winning', () => {
    const notes = sanitizeCalendarNotes([
      note({ title: 'First' }),
      note({ title: 'Second' }),
      'nonsense',
    ])
    assert.equal(notes.length, 1)
    assert.equal(notes[0]?.title, 'Second')
  })
})

describe('groupNotesByDay', () => {
  it('drops tombstones and orders a day newest edit first', () => {
    const grouped = groupNotesByDay([
      note({ id: 'a', updatedAt: '2026-11-01T09:00:00.000Z' }),
      note({ id: 'b', updatedAt: '2026-11-02T09:00:00.000Z' }),
      note({ id: 'c', deleted: true }),
    ])

    assert.deepEqual(
      grouped['2026-11-06']?.map((item) => item.id),
      ['b', 'a']
    )
    assert.equal(grouped['2026-11-07'], undefined)
  })
})

describe('daily cap', () => {
  it('stops at three live notes and ignores the one being edited', () => {
    const notes = [
      note({ id: 'a' }),
      note({ id: 'b' }),
      note({ id: 'c' }),
      note({ id: 'd', deleted: true }),
      note({ id: 'e', day: '2026-11-07' }),
    ]

    assert.equal(countNotesOnDay(notes, '2026-11-06'), 3)
    assert.equal(canAddNoteOnDay(notes, '2026-11-06'), false)
    assert.equal(canAddNoteOnDay(notes, '2026-11-06', 'a'), true)
    assert.equal(canAddNoteOnDay(notes, '2026-11-07'), true)
  })
})

describe('notesChangedSince', () => {
  it('sends everything on a first sync', () => {
    assert.equal(notesChangedSince([note()], null).length, 1)
  })

  it('sends only edits after the last sync, inclusive of newer only', () => {
    const notes = [
      note({ id: 'old', updatedAt: '2026-11-01T10:00:00.000Z' }),
      note({ id: 'new', updatedAt: '2026-11-01T10:00:01.000Z' }),
    ]
    const changed = notesChangedSince(notes, '2026-11-01T10:00:00.000Z')

    assert.deepEqual(
      changed.map((item) => item.id),
      ['new']
    )
  })
})

describe('mergeCalendarNotes', () => {
  it('lets the newest edit win and keeps tombstones', () => {
    const merged = mergeCalendarNotes(
      [
        note({
          id: 'a',
          title: 'local',
          updatedAt: '2026-11-02T00:00:00.000Z',
        }),
      ],
      [
        note({
          id: 'a',
          title: 'remote',
          updatedAt: '2026-11-01T00:00:00.000Z',
        }),
        note({ id: 'b', deleted: true }),
      ]
    )

    assert.equal(merged.length, 2)
    assert.equal(merged.find((item) => item.id === 'a')?.title, 'local')
    assert.equal(merged.find((item) => item.id === 'b')?.deleted, true)
  })

  it('is symmetric when the timestamps tie', () => {
    const local = [note({ id: 'a', title: 'local' })]
    const remote = [note({ id: 'a', title: 'remote' })]
    const first = mergeCalendarNotes(local, remote)
    const second = mergeCalendarNotes(remote, local)

    assert.equal(first.length, 1)
    assert.equal(second.length, 1)
  })
})

describe('pull safety', () => {
  const local = [note({ id: 'a' }), note({ id: 'b', title: 'only local' })]
  const remote = [note({ id: 'a' })]

  it('reports a local-only note as a difference', () => {
    assert.equal(notesDifferFrom(local, remote), true)
    assert.equal(countNotesLostByPull(local, remote), 1)
  })

  it('reports identical copies as no difference', () => {
    assert.equal(notesDifferFrom(remote, remote), false)
    assert.equal(countNotesLostByPull(remote, remote), 0)
  })

  it('treats a different title as a difference', () => {
    assert.equal(
      notesDifferFrom([note({ id: 'a', title: 'edited' })], remote),
      true
    )
  })
})
