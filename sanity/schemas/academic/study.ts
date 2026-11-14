import BookIcon from '@sanity/icons/Book'
import { findCalendarPeriod } from '@shared/config/calendar'
import { API_VERSION } from '@shared/config/sanity-constants'
import {
  isReservedSiteSlug,
  SITE_SLUG_PATTERN,
} from '@shared/config/site-slugs'
import { CALENDAR_STRINGS } from '@shared/strings/calendar-strings'
import { firstFilledLocalizedText } from '@shared/utils/localized-strings'
import { defineType } from 'sanity'
import {
  academicFields,
  academicGrouping,
  academicPreview,
} from '../common/academicFields'
import { filterExistingReferences } from '../util-functions/schemaFilters'
import { sanitizeSlug } from '../util-functions/utilFunctions'
import { validationRules } from '../validation'

const ENTITY = 'study'

export const Study = defineType({
  name: 'study',
  title: 'Study',
  type: 'document',
  icon: BookIcon,
  ...academicPreview({
    icon: BookIcon,
  }),
  ...academicGrouping(ENTITY),
  fields: [
    ...academicFields(ENTITY, [
      'name',
      'slug',
      'logo',
      'picture',
      'description',
      'studentCount',
    ]),
    {
      name: 'assistant',
      title: 'Assistant',
      type: 'reference',
      to: [{ type: 'person' }],
      group: 'administration',
      fieldset: 'administration',
    },
    {
      name: 'faculty',
      title: 'Faculty',
      type: 'reference',
      to: [{ type: 'faculty' }],
      validation: validationRules.isRequired,
      group: 'database',
      fieldset: 'database',
    },
    {
      name: 'siteSlug',
      title: 'Site slug',
      type: 'slug',
      description:
        'The permanent handle this study is served at. It cannot change once the study exists in the database.',
      options: {
        source: (document: Record<string, unknown>) =>
          firstFilledLocalizedText(document.localizedName),
        slugify: (value: string) => sanitizeSlug(value),
      },
      readOnly: ({ document }) =>
        Boolean(document?.dbId) &&
        Boolean(
          (document?.siteSlug as { current?: string } | undefined)?.current
        ),
      group: 'database',
      fieldset: 'database',
      validation: (rule) =>
        rule.required().custom(async (value, context) => {
          const slug = (value as { current?: string } | undefined)?.current
          if (!slug) return 'A site slug is required.'
          if (!SITE_SLUG_PATTERN.test(slug)) {
            return 'Use lowercase letters, digits and inner dashes only.'
          }
          if (isReservedSiteSlug(slug)) return 'This handle is reserved.'

          const currentId = context.document?._id ?? 'drafts.__new__'
          const baseId = currentId.replace(/^drafts\./, '')
          const client = context.getClient({ apiVersion: '2024-01-01' })
          const taken = await client.fetch<number>(
            'count(*[_type == "study" && siteSlug.current == $slug && !(_id in $selfIds)])',
            { slug, selfIds: [baseId, `drafts.${baseId}`] },
            { perspective: 'raw' }
          )

          return taken === 0 || 'Another study already uses this handle.'
        }),
    },
    {
      name: 'r2BucketId',
      title: 'R2 Bucket ID',
      description:
        "Cloudflare R2 bucket used for this study's file storage. Leave empty to use the parent university's bucket.",
      type: 'string',
      group: 'database',
      fieldset: 'database',
      validation: (rule) =>
        rule
          .regex(/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/, {
            name: 'r2 bucket name',
          })
          .warning('Should follow S3/R2 bucket naming rules'),
    },
    {
      name: 'calendars',
      title: 'Calendars',
      type: 'array',
      group: 'information',
      fieldset: 'information',
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
        "This study's calendars. Each covers one half-year; two calendars with the same period cannot both be attached. The study site reads them for its calendar page and the header alert.",
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
    {
      name: 'siteSettings',
      title: 'Site settings',
      type: 'studySiteSettings',
      group: 'information',
      fieldset: 'information',
      options: { collapsible: true, collapsed: true },
    },
    ...academicFields(ENTITY, ['dbId']),
  ],
})
