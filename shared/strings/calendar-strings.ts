import type {
  CalendarEventType,
  CalendarImportance,
  CalendarNoteType,
  CalendarPeriod,
  CalendarView,
} from '../config/calendar'

const pluralEvents = (count: number) => (count === 1 ? 'event' : 'events')

const formatEventCount = (count: number) => `${count} ${pluralEvents(count)}`

const formatMoreCount = (count: number) => `+${count} more`

const monthName = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  timeZone: 'UTC',
})

const monthNameOf = (dayKey: string) =>
  monthName.format(new Date(`${dayKey}T00:00:00.000Z`))

/**
 * Every reader-facing string the calendar page and the header alert use.
 * Copy that depends on a value is a function on this object, so the call site
 * never concatenates.
 */
export const CALENDAR_STRINGS = {
  pageTitle: 'Academic calendar',
  pageSubtitle:
    'Exams, key dates and announcements published by the academic calendar.',
  metaDescription:
    'The academic calendar for every subject, faculty and study: exams, preliminary exams, reminders and announcements.',

  eventType: {
    exam: 'Exam',
    preliminary_exam: 'Preliminary exam',
    reminder: 'Reminder',
    info: 'Info',
    announcement: 'Announcement',
  } satisfies Record<CalendarEventType, string>,

  importance: {
    low: 'Low importance',
    normal: 'Normal importance',
    high: 'High importance',
  } satisfies Record<CalendarImportance, string>,

  /** `January – June 2026`, the title of one half-year period. */
  periodLabel: (period: CalendarPeriod) =>
    `${monthNameOf(period.from)} – ${monthNameOf(period.to)} ${period.year}`,

  viewToggleLabel: 'Calendar view',
  viewMonth: 'Month',
  viewWeek: 'Week',

  previousPeriod: 'Previous',
  nextPeriod: 'Next',
  today: 'Today',

  /** Shown under the grid: the zone every day on the page is bucketed in. */
  timeZoneCaption: (timeZone: string) =>
    `Days and times are shown in ${timeZone}.`,

  dayCellLabel: (dayLabel: string, eventCount: number) =>
    `${dayLabel}, ${eventCount > 0 ? formatEventCount(eventCount) : 'no events'}`,
  moreEvents: formatMoreCount,

  /** Shown in the week view for a day with nothing on it, and for an event that
   * has no detail to add. */
  noEventsInDay: 'No events',

  subjectLabel: 'Subject',
  professorsLabel: 'Professors',

  dataRangeNoticeTitle: 'No calendar data for this period',
  dataRangeNotice: (from: string, to: string) =>
    `The calendar holds events from ${from} to ${to}. Dates outside that range are empty until the calendar document is extended.`,
  dataEmptyTitle: 'The calendar is empty',
  dataEmptyNotice: 'No events have been added to the calendar document yet.',

  emptyTitle: 'Nothing scheduled',
  emptyDescription: (period: CalendarView) =>
    `No events fall in this ${period}. Pick another ${period}, or jump back to today.`,
  emptyAction: 'Go to today',

  errorTitle: 'The calendar could not be loaded',
  errorDescription:
    'Something went wrong while reading the calendar. Try again, and if it keeps happening come back a little later.',
  errorRetry: 'Try again',
  loadingLabel: 'Loading the calendar',

  note: {
    /** Names of the note types, in the order the editor lists them. */
    type: {
      note: 'Note',
      exam: 'Exam',
      preliminary_exam: 'Preliminary exam',
      exam_result: 'Exam result',
    } satisfies Record<CalendarNoteType, string>,

    add: 'Add note',
    addOnDay: (dayLabel: string) => `Add a note for ${dayLabel}`,
    editOnDay: (dayLabel: string) => `Notes for ${dayLabel}`,
    editorTitle: (dayLabel: string) => `Note — ${dayLabel}`,
    typeLabel: 'Type',
    titleLabel: 'Title',
    titlePlaceholder: 'What is it about?',
    bodyLabel: 'Details',
    bodyPlaceholder: 'Optional. Anything worth remembering.',
    save: 'Save note',
    delete: 'Delete note',
    saved: 'Note saved',
    deleted: 'Note deleted',
    saveFailed: "Couldn't save the note",
    deleteFailed: "Couldn't delete the note",
    syncFailed: "Couldn't sync your notes. Try again in a moment.",
    syncTo: 'Sync notes to profile',
    syncFrom: 'Sync notes from profile',
    syncing: 'Syncing…',
    syncToTitle: 'Send your notes to your profile?',
    syncToDescription:
      'Only the notes changed since your last sync are sent. Your profile keeps whichever copy was edited last.',
    syncFromTitle: 'Replace this browser with your profile copy?',
    syncFromDescription:
      'Your notes in this browser are replaced by the ones saved on your profile.',
    syncFromConflictTitle: 'This browser has notes your profile does not',
    syncFromConflict: (count: number) =>
      `${count} ${count === 1 ? 'note' : 'notes'} here ${count === 1 ? 'differs' : 'differ'} from the profile copy, either edited here or never synced. Pulling replaces ${count === 1 ? 'it' : 'them'} with the profile copy — send your notes first if you want to keep ${count === 1 ? 'it' : 'them'}.`,
    syncToDone: 'Notes sent to your profile',
    syncFromDone: 'Notes synced from your profile',
    syncLimitTitle: 'Sync allowance',
    syncLimitShort: (count: number, minutes: number) =>
      `${count} syncs every ${minutes} minutes`,
    syncLimitDaily: (count: number) => `${count} syncs a day`,
    syncLimitNotice:
      'A sync is either direction. Notes stay in this browser between syncs.',
    lastSynced: (value: string) => `Last synced ${value}`,
    neverSynced: 'Not synced yet',
    /** The local-first reminder next to every notes control. */
    localNotice:
      'Notes are saved in this browser. Sync them to your profile in Preferences to keep them on another device.',
    limitReached: (limit: number) =>
      `This day already has ${limit} notes. Delete one to add another.`,
    empty: 'No notes yet.',
    dayCount: (count: number) => `${count} ${count === 1 ? 'note' : 'notes'}`,
    openTimeline: 'Your notes',
    timelineTitle: 'Your notes',
    /** The phone toolbar, where the button shares its row with the view switch. */
    timelineTitleCompact: 'Notes',
    timelineEmpty: 'Notes you add to a day show up here.',
    timelineClose: 'Close notes',
    requiresSignIn: 'Sign in to sync your notes.',
  },

  alert: {
    openCalendar: 'Open the academic calendar',
    openCalendarWithAlerts: (count: number) =>
      `Open the academic calendar — ${formatEventCount(count)} coming up`,
    dismiss: 'Dismiss the calendar alert',
    /** Relative day for the alert copy. */
    today: 'today',
    tomorrow: 'tomorrow',
    inDays: (days: number) => `in ${days} days`,
    /** Subject-linked variant: "Exam in 2 days: Linear Algebra". */
    subjectEvent: (typeLabel: string, when: string, subject: string) =>
      `${typeLabel} ${when}: ${subject}`,
    /** Global variant: an event with no subject, shown by its own title. */
    globalEvent: (title: string, when: string) => `${title} ${when}`,
    moreCount: formatMoreCount,
    /** The preview's own line, plus how many others match. */
    previewWithMore: (label: string, others: number) =>
      others > 0 ? `${label} (${formatMoreCount(others)})` : label,
  },
} as const
