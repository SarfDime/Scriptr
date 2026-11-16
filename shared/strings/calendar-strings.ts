import type {
  CalendarEventType,
  CalendarImportance,
  CalendarNoteType,
  CalendarPeriod,
  CalendarView,
} from '../config/calendar'
import { DEFAULT_LOCALE, type LocaleId } from '../config/localization-constants'
import type { LocalizedText } from '../types/localization.types'
import { getStrings } from '../utils/localized-strings'

/** English and Macedonian do not put the plural boundary in the same place,
 * so each language carries its own count wording. */
const count = (value: number, one: string, many: string) =>
  `${value} ${value === 1 ? one : many}`

const LANGUAGE_NOUNS = {
  en: {
    events: (value: number) => count(value, 'event', 'events'),
    notes: (value: number) => count(value, 'note', 'notes'),
    more: (value: number) => `+${value} more`,
    thisPeriod: { month: 'this month', week: 'this week' },
    anotherPeriod: { month: 'another month', week: 'another week' },
  },
  mk: {
    events: (value: number) => count(value, 'настан', 'настани'),
    notes: (value: number) => count(value, 'белешка', 'белешки'),
    more: (value: number) => `уште ${value}`,
    thisPeriod: { month: 'овој месец', week: 'оваа недела' },
    anotherPeriod: { month: 'друг месец', week: 'друга недела' },
  },
} as const satisfies Record<
  LocaleId,
  {
    events: (value: number) => string
    notes: (value: number) => string
    more: (value: number) => string
    thisPeriod: Record<CalendarView, string>
    anotherPeriod: Record<CalendarView, string>
  }
>

/** One formatter per language: building an `Intl.DateTimeFormat` inside a
 * message would run on every render, and a single module-level one would keep
 * the month names in one language whatever the reader picked. */
const MONTH_NAME = {
  en: new Intl.DateTimeFormat('en-GB', { month: 'long', timeZone: 'UTC' }),
  mk: new Intl.DateTimeFormat('mk-MK', { month: 'long', timeZone: 'UTC' }),
} satisfies Record<LocaleId, Intl.DateTimeFormat>

const monthNameOf = (locale: LocaleId, dayKey: string) =>
  MONTH_NAME[locale].format(new Date(`${dayKey}T00:00:00.000Z`))

/**
 * Every reader-facing string the calendar page and the header alert use.
 * Copy that depends on a value is a function on this object, so the call site
 * never concatenates.
 *
 * The `{ en, mk }` entries are the source of truth; `CALENDAR_STRINGS` at the
 * bottom is the English view for the call sites that have no reader — the
 * Studio's labels and previews.
 */
export const CALENDAR_STRINGS_PACK = {
  pageTitle: { en: 'Academic calendar', mk: 'Академски календар' },
  pageSubtitle: {
    en: 'Exams, key dates and announcements published by the academic calendar.',
    mk: 'Испити, клучни датуми и соопштенија објавени од академскиот календар.',
  },
  metaDescription: {
    en: 'The academic calendar for every subject, faculty and study: exams, preliminary exams, reminders and announcements.',
    mk: 'Академскиот календар за секој предмет, факултет и студија: испити, колоквиуми, потсетници и соопштенија.',
  },

  eventType: {
    exam: { en: 'Exam', mk: 'Испит' },
    preliminary_exam: { en: 'Preliminary exam', mk: 'Колоквиум' },
    reminder: { en: 'Reminder', mk: 'Потсетник' },
    info: { en: 'Info', mk: 'Информација' },
    announcement: { en: 'Announcement', mk: 'Соопштение' },
  } as const satisfies Record<CalendarEventType, LocalizedText>,

  importance: {
    low: { en: 'Low importance', mk: 'Малку важно' },
    normal: { en: 'Normal importance', mk: 'Средно важно' },
    high: { en: 'High importance', mk: 'Многу важно' },
  } as const satisfies Record<CalendarImportance, LocalizedText>,

  /** `January – June 2026`, the title of one half-year period. */
  periodLabel: (period: CalendarPeriod): LocalizedText => ({
    en: `${monthNameOf('en', period.from)} – ${monthNameOf('en', period.to)} ${period.year}`,
    mk: `${monthNameOf('mk', period.from)} – ${monthNameOf('mk', period.to)} ${period.year}`,
  }),

  viewToggleLabel: { en: 'Calendar view', mk: 'Преглед на календарот' },
  viewMonth: { en: 'Month', mk: 'Месец' },
  viewWeek: { en: 'Week', mk: 'Недела' },

  previousPeriod: { en: 'Previous', mk: 'Претходно' },
  nextPeriod: { en: 'Next', mk: 'Следно' },
  today: { en: 'Today', mk: 'Денес' },

  /** Shown under the grid: the zone every day on the page is bucketed in. */
  timeZoneCaption: (timeZone: string): LocalizedText => ({
    en: `Days and times are shown in ${timeZone}.`,
    mk: `Деновите и времињата се прикажани во ${timeZone}.`,
  }),

  dayCellLabel: (dayLabel: string, eventCount: number): LocalizedText => ({
    en: `${dayLabel}, ${eventCount > 0 ? LANGUAGE_NOUNS.en.events(eventCount) : 'no events'}`,
    mk: `${dayLabel}, ${eventCount > 0 ? LANGUAGE_NOUNS.mk.events(eventCount) : 'нема настани'}`,
  }),
  moreEvents: (hidden: number): LocalizedText => ({
    en: LANGUAGE_NOUNS.en.more(hidden),
    mk: LANGUAGE_NOUNS.mk.more(hidden),
  }),

  /** Shown in the week view for a day with nothing on it, and for an event that
   * has no detail to add. */
  noEventsInDay: { en: 'No events', mk: 'Нема настани' },

  subjectLabel: { en: 'Subject', mk: 'Предмет' },
  professorsLabel: { en: 'Professors', mk: 'Професори' },

  dataRangeNoticeTitle: {
    en: 'No calendar data for this period',
    mk: 'Нема податоци од календарот за овој период',
  },
  dataRangeNotice: (from: string, to: string): LocalizedText => ({
    en: `The calendar holds events from ${from} to ${to}. Dates outside that range are empty until the calendar document is extended.`,
    mk: `Календарот содржи настани од ${from} до ${to}. Датумите надвор од тој опсег се празни додека не се прошири документот на календарот.`,
  }),
  dataEmptyTitle: { en: 'The calendar is empty', mk: 'Календарот е празен' },
  dataEmptyNotice: {
    en: 'No events have been added to the calendar document yet.',
    mk: 'Сè уште нема додадени настани во документот на календарот.',
  },

  emptyTitle: { en: 'Nothing scheduled', mk: 'Ништо не е закажано' },
  emptyDescription: (period: CalendarView): LocalizedText => ({
    en: `No events fall in ${LANGUAGE_NOUNS.en.thisPeriod[period]}. Pick ${LANGUAGE_NOUNS.en.anotherPeriod[period]}, or jump back to today.`,
    mk: `Нема настани во ${LANGUAGE_NOUNS.mk.thisPeriod[period]}. Избери ${LANGUAGE_NOUNS.mk.anotherPeriod[period]} или скокни назад на денес.`,
  }),
  emptyAction: { en: 'Go to today', mk: 'Оди на денес' },

  errorTitle: {
    en: 'The calendar could not be loaded',
    mk: 'Календарот не може да се вчита',
  },
  errorDescription: {
    en: 'Something went wrong while reading the calendar. Try again, and if it keeps happening come back a little later.',
    mk: 'Нешто тргна наопаку при читањето на календарот. Обиди се повторно, а ако продолжува, врати се малку подоцна.',
  },
  errorRetry: { en: 'Try again', mk: 'Обиди се повторно' },
  loadingLabel: { en: 'Loading the calendar', mk: 'Се вчитува календарот' },

  note: {
    /** Names of the note types, in the order the editor lists them. */
    type: {
      note: { en: 'Note', mk: 'Белешка' },
      exam: { en: 'Exam', mk: 'Испит' },
      preliminary_exam: { en: 'Preliminary exam', mk: 'Колоквиум' },
      exam_result: { en: 'Exam result', mk: 'Резултат од испит' },
    } as const satisfies Record<CalendarNoteType, LocalizedText>,

    add: { en: 'Add note', mk: 'Додај белешка' },
    addOnDay: (dayLabel: string): LocalizedText => ({
      en: `Add a note for ${dayLabel}`,
      mk: `Додај белешка за ${dayLabel}`,
    }),
    editOnDay: (dayLabel: string): LocalizedText => ({
      en: `Notes for ${dayLabel}`,
      mk: `Белешки за ${dayLabel}`,
    }),
    editorTitle: (dayLabel: string): LocalizedText => ({
      en: `Note — ${dayLabel}`,
      mk: `Белешка — ${dayLabel}`,
    }),
    typeLabel: { en: 'Type', mk: 'Тип' },
    titleLabel: { en: 'Title', mk: 'Наслов' },
    titlePlaceholder: { en: 'What is it about?', mk: 'За што е?' },
    bodyLabel: { en: 'Details', mk: 'Детали' },
    bodyPlaceholder: {
      en: 'Optional. Anything worth remembering.',
      mk: 'Незадолжително. Сè што вреди да се запамети.',
    },
    save: { en: 'Save note', mk: 'Зачувај белешка' },
    delete: { en: 'Delete note', mk: 'Избриши белешка' },
    saved: { en: 'Note saved', mk: 'Белешката е зачувана' },
    deleted: { en: 'Note deleted', mk: 'Белешката е избришана' },
    saveFailed: {
      en: "Couldn't save the note",
      mk: 'Не успеа зачувувањето на белешката',
    },
    deleteFailed: {
      en: "Couldn't delete the note",
      mk: 'Не успеа бришењето на белешката',
    },
    syncFailed: {
      en: "Couldn't sync your notes. Try again in a moment.",
      mk: 'Не успеа синхронизацијата на белешките. Обиди се за момент.',
    },
    syncTo: {
      en: 'Sync notes to profile',
      mk: 'Синхронизирај белешки кон профилот',
    },
    syncFrom: {
      en: 'Sync notes from profile',
      mk: 'Синхронизирај белешки од профилот',
    },
    syncing: { en: 'Syncing…', mk: 'Се синхронизира…' },
    syncToTitle: {
      en: 'Send your notes to your profile?',
      mk: 'Да се испратат белешките до профилот?',
    },
    syncToDescription: {
      en: 'Only the notes changed since your last sync are sent. Your profile keeps whichever copy was edited last.',
      mk: 'Се испраќаат само белешките изменети по последната синхронизација. Профилот ја задржува копијата што е последна изменета.',
    },
    syncFromTitle: {
      en: 'Replace this browser with your profile copy?',
      mk: 'Да се замени овој прелистувач со копијата од профилот?',
    },
    syncFromDescription: {
      en: 'Your notes in this browser are replaced by the ones saved on your profile.',
      mk: 'Белешките во овој прелистувач се заменуваат со тие зачувани на профилот.',
    },
    syncFromConflictTitle: {
      en: 'This browser has notes your profile does not',
      mk: 'Овој прелистувач има белешки што профилот ги нема',
    },
    syncFromConflict: (conflicts: number): LocalizedText => ({
      en: `${count(conflicts, 'note here differs', 'notes here differ')} from the profile copy, either edited here or never synced. Pulling replaces ${conflicts === 1 ? 'it' : 'them'} with the profile copy — send your notes first if you want to keep ${conflicts === 1 ? 'it' : 'them'}.`,
      mk:
        conflicts === 1
          ? '1 белешка тука се разликува од копијата на профилот — или е изменета тука или никогаш не е синхронизирана. Влечењето ја заменува со копијата од профилот. Ако сакаш да ја задржиш, прво испрати ги белешките.'
          : `${conflicts} белешки тука се разликуваат од копијата на профилот — или се изменети тука или никогаш не се синхронизирани. Влечењето ги заменува со копијата од профилот. Ако сакаш да ги задржиш, прво испрати ги белешките.`,
    }),
    syncToDone: {
      en: 'Notes sent to your profile',
      mk: 'Белешките се испратени до профилот',
    },
    syncFromDone: {
      en: 'Notes synced from your profile',
      mk: 'Белешките се синхронизирани од профилот',
    },
    syncLimitTitle: { en: 'Sync allowance', mk: 'Дозволена синхронизација' },
    syncLimitShort: (limit: number, minutes: number): LocalizedText => ({
      en: `${limit} syncs every ${minutes} minutes`,
      mk: `${limit} синхронизации на секои ${minutes} минути`,
    }),
    syncLimitDaily: (limit: number): LocalizedText => ({
      en: `${limit} syncs a day`,
      mk: `${limit} синхронизации дневно`,
    }),
    syncLimitNotice: {
      en: 'A sync is either direction. Notes stay in this browser between syncs.',
      mk: 'Синхронизацијата е во една насока. Белешките остануваат во овој прелистувач помеѓу синхронизации.',
    },
    lastSynced: (value: string): LocalizedText => ({
      en: `Last synced ${value}`,
      mk: `Последна синхронизација ${value}`,
    }),
    neverSynced: { en: 'Not synced yet', mk: 'Сè уште не е синхронизирано' },
    /** The local-first reminder next to every notes control. */
    localNotice: {
      en: 'Notes are saved in this browser and sent to your profile once a week. Sync them in Preferences to move them sooner.',
      mk: 'Белешките се зачувуваат во овој прелистувач и се испраќаат до профилот еднаш неделно. Синхронизирај ги во Поставки за да ги пренесеш порано.',
    },
    autoSyncNotice: (days: number): LocalizedText => ({
      en: `Automatic save: at most once every ${days} days, and only when a note changed.`,
      mk: `Автоматско зачувување: најмногу еднаш на ${days} дена, и само кога некоја белешка е изменета.`,
    }),
    limitReached: (limit: number): LocalizedText => ({
      en: `This day already has ${limit} notes. Delete one to add another.`,
      mk: `Овој ден веќе има ${limit} белешки. Избриши една за да додадеш друга.`,
    }),
    empty: { en: 'No notes yet.', mk: 'Сè уште нема белешки.' },
    dayCount: (notes: number): LocalizedText => ({
      en: LANGUAGE_NOUNS.en.notes(notes),
      mk: LANGUAGE_NOUNS.mk.notes(notes),
    }),
    openTimeline: { en: 'Your notes', mk: 'Твоите белешки' },
    timelineTitle: { en: 'Your notes', mk: 'Твоите белешки' },
    /** The phone toolbar, where the button shares its row with the view switch. */
    timelineTitleCompact: { en: 'Notes', mk: 'Белешки' },
    timelineEmpty: {
      en: 'Notes you add to a day show up here.',
      mk: 'Белешките што ќе ги додадеш на некој ден се појавуваат тука.',
    },
    timelineClose: { en: 'Close notes', mk: 'Затвори белешки' },
    requiresSignIn: {
      en: 'Sign in to sync your notes.',
      mk: 'Најави се за да ги синхронизираш белешките.',
    },
  },

  alert: {
    openCalendar: {
      en: 'Open the academic calendar',
      mk: 'Отвори го академскиот календар',
    },
    openCalendarWithAlerts: (alerts: number): LocalizedText => ({
      en: `Open the academic calendar — ${LANGUAGE_NOUNS.en.events(alerts)} coming up`,
      mk: `Отвори го академскиот календар — ${LANGUAGE_NOUNS.mk.events(alerts)} ${alerts === 1 ? 'претстои' : 'претстојат'}`,
    }),
    dismiss: {
      en: 'Dismiss the calendar alert',
      mk: 'Отстрани го известувањето од календарот',
    },
    /** Relative day for the alert copy. */
    today: { en: 'today', mk: 'денес' },
    tomorrow: { en: 'tomorrow', mk: 'утре' },
    inDays: (days: number): LocalizedText => ({
      en: `in ${days} days`,
      mk: `за ${days} дена`,
    }),
    /** Subject-linked variant: "Exam in 2 days: Linear Algebra". */
    subjectEvent: (
      typeLabel: string,
      when: string,
      subject: string
    ): LocalizedText => ({
      en: `${typeLabel} ${when}: ${subject}`,
      mk: `${typeLabel} ${when}: ${subject}`,
    }),
    /** Global variant: an event with no subject, shown by its own title. */
    globalEvent: (title: string, when: string): LocalizedText => ({
      en: `${title} ${when}`,
      mk: `${title} ${when}`,
    }),
    moreCount: (others: number): LocalizedText => ({
      en: LANGUAGE_NOUNS.en.more(others),
      mk: LANGUAGE_NOUNS.mk.more(others),
    }),
    /** The preview's own line, plus how many others match. */
    previewWithMore: (label: string, others: number): LocalizedText => ({
      en: others > 0 ? `${label} (${LANGUAGE_NOUNS.en.more(others)})` : label,
      mk: others > 0 ? `${label} (${LANGUAGE_NOUNS.mk.more(others)})` : label,
    }),
  },
} as const

/** English view for the call sites with no reader: the Studio's field titles,
 * previews and validation messages. */
export const CALENDAR_STRINGS = getStrings(
  CALENDAR_STRINGS_PACK,
  DEFAULT_LOCALE
)
