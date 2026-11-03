import BookIcon from '@sanity/icons/Book'
import { defineType } from 'sanity'
import {
  academicFields,
  academicGrouping,
  academicPreview,
} from '../common/academicFields'
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
    ...academicFields(ENTITY, ['dbId']),
  ],
})
