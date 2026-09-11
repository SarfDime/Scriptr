import BookIcon from '@sanity/icons/Book'
import { defineType } from 'sanity'
import {
  academicDescriptionField,
  academicNameField,
  academicSlugField,
  databaseIdField,
} from '../common/academicFields'
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
    academicNameField(),
    academicDescriptionField(),
    academicSlugField({ hierarchy: 'study' }),
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
    databaseIdField(),
  ],
})
