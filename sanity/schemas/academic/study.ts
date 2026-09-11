import BookIcon from '@sanity/icons/Book'
import type { Rule } from 'sanity'
import { defineType } from 'sanity'
import { validationRules } from '../validation'

export const Study = defineType({
  name: 'study',
  title: 'Study',
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
      name: 'description',
      title: 'Description',
      type: 'richTextLite',
    },
    {
      name: 'faculty',
      title: 'Faculty',
      type: 'reference',
      to: [{ type: 'faculty' }],
      validation: validationRules.isRequired,
    },
    {
      name: 'assistant',
      title: 'Assistant',
      type: 'reference',
      to: [{ type: 'person' }],
    },
    {
      name: 'dbId',
      title: 'Database ID',
      type: 'string',
      readOnly: true,
      validation: (rule: Rule) =>
        rule.custom((value: string) =>
          value
            ? true
            : 'Run the "Create in Database" action before publishing.'
        ),
    },
  ],
})
