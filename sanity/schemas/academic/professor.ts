import UserIcon from '@sanity/icons/User'
import type { Rule } from 'sanity'
import { defineType } from 'sanity'
import { validationRules } from '../validation'

export const Professor = defineType({
  // Editorial record for a professor; the runtime identity lives in Postgres, linked via dbId.
  name: 'professor',
  title: 'Professor',
  type: 'document',
  icon: UserIcon,
  preview: {
    select: { title: 'name', media: 'picture', subtitle: 'dbId' },
    prepare: ({ title, media, subtitle }) => ({
      title,
      media,
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
      name: 'picture',
      title: 'Picture',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'bio',
      title: 'Bio',
      type: 'richTextLite',
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
