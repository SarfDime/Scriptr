import CalendarIcon from '@sanity/icons/Calendar'
import { calendarPeriods, findCalendarPeriod } from '@shared/config/calendar'
import { API_VERSION } from '@shared/config/sanity-constants'
import { CALENDAR_STRINGS } from '@shared/strings/calendar-strings'
import type { ReferenceFilterResolverContext, ValidationContext } from 'sanity'
import { defineField, defineType } from 'sanity'
import type { Parent } from '../../types/schema-prop.types'
import { filterExistingReferences } from '../util-functions/schemaFilters'

/** `filterExistingReferences` predates the current reference-filter context
 * type, whose `parent` is a looser record — the values are still references. */
const existingReferencesFilter = (
  parent: ReferenceFilterResolverContext['parent']
) => filterExistingReferences({ parent: parent as Parent | undefined })

const referenceIds = (value: unknown): Array<string> =>
  Array.isArray(value)
    ? value.flatMap((item) =>
        typeof item === 'object' &&
        item !== null &&
        '_ref' in item &&
        typeof item._ref === 'string'
          ? [item._ref]
          : []
      )
    : []

const periodStartIso = (period: { from: string }) =>
  `${period.from}T00:00:00.000Z`

const periodEndIso = (period: { to: string }) => `${period.to}T23:59:59.999Z`

/**
 * A calendar covers one half-year — 1 January to 30 June, or 1 July to
 * 31 December — and holds that half's events. The website attaches several of
 * them; together they are the year the site reads once per build.
 */
export const Calendar = defineType({
  name: 'calendar',
  title: 'Calendar',
  type: 'document',
  icon: CalendarIcon,
  // Same fieldset/group pairing the academic schemas use.
  groups: [
    { name: 'information', title: 'Period' },
    { name: 'events', title: 'Events' },
  ],
  fieldsets: [
    {
      name: 'information',
      title: 'Period',
      options: { collapsible: false, collapsed: false },
    },
    {
      name: 'events',
      title: 'Events',
      options: { collapsible: false, collapsed: false },
    },
  ],
  preview: {
    select: { period: 'period', events: 'events' },
    prepare: (selection: Record<string, unknown>) => {
      const period = findCalendarPeriod(selection.period as string | undefined)
      const count = Array.isArray(selection.events)
        ? selection.events.length
        : 0

      return {
        title: period ? CALENDAR_STRINGS.periodLabel(period) : 'No period',
        subtitle: `${count} event${count === 1 ? '' : 's'}`,
        media: CalendarIcon,
      }
    },
  },
  fields: [
    defineField({
      name: 'period',
      title: 'Period',
      type: 'string',
      group: 'information',
      fieldset: 'information',
      description:
        'The half-year this calendar covers. Periods always run from 1 January or 1 July, and only six-month periods are offered.',
      options: {
        list: calendarPeriods().map((period) => ({
          value: period.id,
          title: CALENDAR_STRINGS.periodLabel(period),
        })),
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'events',
      title: 'Events',
      type: 'array',
      group: 'events',
      fieldset: 'events',
      of: [
        {
          type: 'reference',
          to: [{ type: 'calendarEvent' }],
          options: {
            disableNew: true,
            // Only events dated inside this calendar's period are offered, and
            // never one already in the list.
            filter: ({ document, parent }: ReferenceFilterResolverContext) => {
              const period = findCalendarPeriod(
                document?.period as string | undefined
              )
              if (!period) return { filter: 'false' }

              const existing = existingReferencesFilter(parent)

              return {
                filter: `dateTime(date) >= dateTime($from) && dateTime(date) <= dateTime($to) && ${existing.filter}`,
                params: {
                  from: periodStartIso(period),
                  to: periodEndIso(period),
                  ...('params' in existing ? existing.params : {}),
                },
              }
            },
          },
        },
      ],
      description:
        'Select a period first. Only events dated inside it can be added, and each event can appear once.',
      readOnly: ({ document }) => !document?.period,
      validation: (rule) =>
        rule
          .unique()
          .custom(async (value: unknown, context: ValidationContext) => {
            const ids = referenceIds(value)
            const period = findCalendarPeriod(
              context.document?.period as string | undefined
            )

            if (ids.length === 0) return true
            if (!period) return 'Choose a period for this calendar first'

            const client = context.getClient({ apiVersion: API_VERSION })
            const events = await client.fetch<
              Array<{ _id: string; date: string | null }>
            >('*[_id in $ids]{_id, date}', { ids })

            const outside = events.filter(
              (event) =>
                event.date &&
                (Date.parse(event.date) < Date.parse(periodStartIso(period)) ||
                  Date.parse(event.date) > Date.parse(periodEndIso(period)))
            )

            return outside.length === 0
              ? true
              : `${outside.length} event${outside.length === 1 ? '' : 's'} fall outside ${CALENDAR_STRINGS.periodLabel(period)}. Remove them, or move them to the calendar for their own period.`
          }),
    }),
  ],
})
