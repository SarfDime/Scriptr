import EarthGlobeIcon from '@sanity/icons/EarthGlobe'
import type { Rule } from 'sanity'
import { defineType } from 'sanity'
import { validationRules } from '../validation'

export const University = defineType({
  // Editorial record for a university; the runtime identity lives in Postgres, linked via dbId.
  name: 'university',
  title: 'University',
  type: 'document',
  icon: EarthGlobeIcon,
  preview: {
    select: { title: 'name', subtitle: 'dbId' },
    prepare: ({ title, subtitle }) => ({
      title,
      subtitle: subtitle ? `DB: ${subtitle}` : 'Not linked to database',
    }),
  },
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: validationRules.isRequired,
    },
    {
      name: 'dbId',
      title: 'Database ID',
      type: 'string',
      readOnly: true,
      description:
        'Set by the "Create in Database" action. Publishing is blocked until this exists.',
      validation: (rule: Rule) =>
        rule.custom((value: string) =>
          value
            ? true
            : 'Run the "Create in Database" action before publishing.'
        ),
    },
  ],
})
