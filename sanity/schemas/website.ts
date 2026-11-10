import { findCalendarPeriod } from '@shared/config/calendar'
import { API_VERSION } from '@shared/config/sanity-constants'
import { CALENDAR_STRINGS } from '@shared/strings/calendar-strings'
import { defineType } from 'sanity'
import { FieldsetWithClass } from '../components/FieldsetWithClass'
import { filterExistingReferences } from './util-functions/schemaFilters'
import { validationRules } from './validation'

const WebsiteContent = [
  {
    name: 'navAndFooterFields',
    type: 'string',
    fieldset: 'navAndFooter',
    components: {
      field: FieldsetWithClass,
    },
  },

  {
    type: 'reference',
    name: 'navMenu',
    title: 'Nav on website',
    fieldset: 'navAndFooter',
    options: {
      disableNew: true,
    },
    validation: validationRules.isRequired,
    to: [{ type: 'navMenu' }],
  },

  {
    name: 'pagesFields',
    type: 'string',
    fieldset: 'pages',
    components: {
      field: FieldsetWithClass,
    },
  },

  {
    type: 'array',
    name: 'universities',
    title: 'Universities',
    group: 'websitePagesMenu',
    fieldset: 'pages',
    description: 'Universities that will be added to the website.',
    of: [
      {
        type: 'reference',
        options: {
          filter: filterExistingReferences,
          disableNew: true,
        },
        to: [{ type: 'university' }],
      },
    ],
  },
]

export const Website = defineType({
  name: 'website',
  title: 'Website',
  type: 'document',
  groups: [
    {
      name: 'websiteTitleMenu',
      title: 'Website title',
    },
    {
      name: 'websitePagesMenu',
      title: 'Pages',
    },
    {
      name: 'calendarMenu',
      title: 'Calendar',
    },
  ],
  fieldsets: [
    {
      name: 'pages',
      options: { collapsible: false, collapsed: false },
    },
    {
      name: 'navAndFooter',
      options: { collapsible: false, collapsed: false },
    },
    {
      name: 'theming',
      options: { collapsible: true, collapsed: false },
    },
    {
      name: 'calendar',
      title: 'Calendar',
      options: { collapsible: false, collapsed: false },
    },
  ],
  fields: [
    {
      title: 'Website title',
      name: 'websiteTitle',
      type: 'string',
      group: 'websiteTitleMenu',
      description: 'The title of the website.',
    },
    {
      title: 'Site name',
      name: 'siteName',
      type: 'string',
      group: 'websiteTitleMenu',
      description: 'The brand name used in SEO titles and social metadata.',
    },
    {
      title: 'Site URL',
      name: 'siteUrl',
      type: 'url',
      group: 'websiteTitleMenu',
      description:
        'Canonical public URL for the website, e.g. https://example.com',
    },
    {
      title: 'Default SEO title',
      name: 'defaultSeoTitle',
      type: 'string',
      group: 'websiteTitleMenu',
      description: 'Fallback title used when a page does not specify one.',
    },
    {
      title: 'Default SEO description',
      name: 'defaultSeoDescription',
      type: 'text',
      rows: 3,
      group: 'websiteTitleMenu',
      description:
        'Fallback description used in metadata for pages without their own copy.',
    },
    {
      title: 'Default SEO keywords',
      name: 'defaultKeywords',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'websiteTitleMenu',
      description:
        'Default keywords to append to page metadata when no page-specific keywords are set.',
    },

    {
      title: 'Dark Theme Background',
      name: 'dtBackground',
      type: 'reference',
      to: [{ type: 'starCanvas' }],
    },
    {
      title: 'Light Theme Background',
      name: 'ltBackground',
      type: 'reference',
      to: [{ type: 'starCanvas' }],
    },
    {
      title: 'Calendars',
      name: 'calendars',
      type: 'array',
      group: 'calendarMenu',
      fieldset: 'calendar',
      of: [
        {
          type: 'reference',
          to: [{ type: 'calendar' }],
          options: {
            disableNew: true,
            filter: filterExistingReferences,
          },
        },
      ],
      description:
        'Seven to twelve months of calendars. Each covers one half-year; two calendars with the same period cannot both be attached.',
      validation: (rule) =>
        rule.unique().custom(async (value, context) => {
          const ids = (Array.isArray(value) ? value : []).flatMap((item) =>
            typeof item === 'object' &&
            item !== null &&
            '_ref' in item &&
            typeof item._ref === 'string'
              ? [item._ref]
              : []
          )
          if (ids.length === 0) return true

          const client = context.getClient({ apiVersion: API_VERSION })
          const periods = await client.fetch<
            Array<{ _id: string; period: string | null }>
          >('*[_id in $ids]{_id, period}', { ids })
          const seen = new Set<string>()
          const duplicates = periods.filter(({ period }) => {
            if (!period) return false
            if (seen.has(period)) return true
            seen.add(period)
            return false
          })

          if (duplicates.length === 0) return true

          const labels = duplicates.map(({ period }) => {
            const found = findCalendarPeriod(period)
            return found
              ? CALENDAR_STRINGS.periodLabel(found)
              : 'Unknown period'
          })

          return `Two attached calendars cannot share a period (${[...new Set(labels)].join(', ')}).`
        }),
    },
    ...WebsiteContent,
  ],
})
