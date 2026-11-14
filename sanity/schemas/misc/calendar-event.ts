import CalendarIcon from '@sanity/icons/Calendar'
import {
  CALENDAR_EVENT_TYPES,
  CALENDAR_IMPORTANCES,
  CALENDAR_TIME_ZONE,
  type CalendarEventType,
  DEFAULT_CALENDAR_IMPORTANCE,
  isCalendarSubjectRequired,
} from '@shared/config/calendar'
import { CALENDAR_STRINGS } from '@shared/strings/calendar-strings'
import type { Reference, ReferenceFilterResolverContext } from 'sanity'
import { defineField, defineType } from 'sanity'
import type { Parent } from '../../types/schema-prop.types'
import { headerSchemaFields } from '../common/headerFields'
import { filterExistingReferences } from '../util-functions/schemaFilters'

/** `filterExistingReferences` predates the current reference-filter context
 * type, whose `parent` is a looser record — the values are still references. */
const existingReferencesFilter = (
  parent: ReferenceFilterResolverContext['parent']
) => filterExistingReferences({ parent: parent as Parent | undefined })

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: CALENDAR_TIME_ZONE,
})

const subjectRefOf = (document: Record<string, unknown> | null | undefined) => {
  const subject = document?.subject as Reference | undefined
  return subject?._ref
}

/**
 * Sanity-only content, like `studyTip`: no `dbId`, no Create/Sync actions and
 * no database record. The website reads these documents directly for
 * `/calendar` and for the header alert, so a publish reaches readers on the
 * next rebuild rather than immediately.
 */
export const CalendarEvent = defineType({
  name: 'calendarEvent',
  title: 'Calendar event',
  type: 'document',
  icon: CalendarIcon,
  // Same fieldset/group pairing the academic schemas use: one collapsible
  // section per area of the form, each with its own group so the editor can
  // jump straight to it.
  groups: [
    { name: 'information', title: 'Event' },
    { name: 'schedule', title: 'Schedule' },
    { name: 'relations', title: 'Subject & professors' },
  ],
  fieldsets: [
    {
      name: 'information',
      title: 'Event',
      options: { collapsible: true, collapsed: false },
    },
    {
      name: 'schedule',
      title: 'Schedule',
      options: { collapsible: true, collapsed: false },
    },
    {
      name: 'relations',
      title: 'Subject & professors',
      options: { collapsible: true, collapsed: false },
    },
  ],
  preview: {
    select: {
      title: 'localizedTitle.en',
      titleMk: 'localizedTitle.mk',
      date: 'date',
      type: 'type',
    },
    prepare: ({ title, titleMk, date, type }: Record<string, string>) => ({
      title: title || titleMk || 'Untitled event',
      subtitle: [
        type ? CALENDAR_STRINGS.eventType[type as CalendarEventType] : null,
        date ? dateTimeFormatter.format(new Date(date)) : null,
      ]
        .filter(Boolean)
        .join(' • '),
    }),
  },
  orderings: [
    {
      title: 'Date (soonest first)',
      name: 'dateAsc',
      by: [{ field: 'date', direction: 'asc' }],
    },
    {
      title: 'Date (latest first)',
      name: 'dateDesc',
      by: [{ field: 'date', direction: 'desc' }],
    },
  ],
  fields: [
    ...headerSchemaFields({
      title: 'Event title',
      type: 'string',
      isRequired: true,
      group: 'information',
      fieldset: 'information',
      description:
        'Shown on the calendar and in the header alert for events without a subject.',
      subtitle: {
        showSubtitle: true,
        type: 'string',
        title: 'Description',
        group: 'information',
        fieldset: 'information',
        description:
          'Optional detail, shown in the calendar only. Leave empty for a one-line event.',
      },
    }),
    defineField({
      name: 'date',
      title: 'Date and time',
      type: 'datetime',
      group: 'schedule',
      fieldset: 'schedule',
      description:
        'When the event happens, in local time. The calendar groups events by day in Europe/Skopje.',
      options: { dateFormat: 'YYYY-MM-DD', timeFormat: 'HH:mm' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      group: 'schedule',
      fieldset: 'schedule',
      description:
        'Decides the calendar colour and label. Exams and preliminary exams must be linked to a subject.',
      options: {
        layout: 'radio',
        list: CALENDAR_EVENT_TYPES.map((value) => ({
          value,
          title: CALENDAR_STRINGS.eventType[value],
        })),
      },
      initialValue: 'info',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'importance',
      title: 'Importance',
      type: 'string',
      group: 'schedule',
      fieldset: 'schedule',
      description:
        'Adds emphasis in the calendar. A high-importance event without a subject also reaches every signed-in reader in the header alert.',
      options: {
        layout: 'radio',
        list: CALENDAR_IMPORTANCES.map((value) => ({
          value,
          title: CALENDAR_STRINGS.importance[value],
        })),
      },
      initialValue: DEFAULT_CALENDAR_IMPORTANCE,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'subject',
      title: 'Subject',
      type: 'reference',
      to: [{ type: 'subject' }],
      group: 'relations',
      fieldset: 'relations',
      description:
        'The subject this event belongs to. Required for exams, and it narrows the professor list below.',
      options: { disableNew: true },
      validation: (rule) =>
        rule.custom((value, context) => {
          const type = context.document?.type as string | undefined
          if (!isCalendarSubjectRequired(type)) return true
          return value ? true : 'An exam has to be linked to a subject'
        }),
    }),
    defineField({
      name: 'professors',
      title: 'Professors',
      type: 'array',
      group: 'relations',
      fieldset: 'relations',
      of: [
        {
          type: 'reference',
          to: [{ type: 'professor' }],
          options: {
            disableNew: true,
            // Once a subject is chosen, only the professors assigned to it are
            // offered; either way an already-picked professor drops out.
            filter: ({ document, parent }: ReferenceFilterResolverContext) => {
              const subjectId = subjectRefOf(document)
              const existing = existingReferencesFilter(parent)
              const conditions = [existing.filter]
              const params: Record<string, unknown> = {
                ...('params' in existing ? existing.params : {}),
              }

              if (subjectId) {
                conditions.push(
                  '_id in *[_id == $subjectId][0].professors[]._ref'
                )
                params.subjectId = subjectId
              }

              return {
                filter: conditions.filter(Boolean).join(' && '),
                params,
              }
            },
          },
        },
      ],
      description:
        'Optional. Once a subject is selected, only its assigned professors can be picked.',
      readOnly: ({ document }) => !subjectRefOf(document),
    }),
  ],
})
