import BookIcon from '@sanity/icons/Book'
import type { Rule } from 'sanity'
import { defineType } from 'sanity'
import { validationRules } from '../validation'

export const Subject = defineType({
  // Editorial record for a subject; the runtime identity lives in Postgres, linked via dbId.
  name: 'subject',
  title: 'Subject',
  type: 'document',
  icon: BookIcon,
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
      name: 'year',
      title: 'Year',
      type: 'number',
      description: 'Used to create the database record (1-8).',
      validation: (rule: Rule) => rule.required().min(1).max(8),
    },
    {
      name: 'examSession',
      title: 'Exam session',
      type: 'string',
      description: 'Used to create the database record.',
      options: {
        list: ['january', 'june', 'september'],
      },
      validation: validationRules.isRequired,
    },
    {
      name: 'faculty',
      title: 'Faculty',
      type: 'reference',
      to: [{ type: 'faculty' }],
      description:
        'Used to create the database record. Changing the parent faculty afterwards must be done through the admin API.',
      validation: validationRules.isRequired,
    },
    {
      name: 'description',
      title: 'Description',
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
