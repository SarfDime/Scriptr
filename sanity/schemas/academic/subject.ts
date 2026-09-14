import BookIcon from '@sanity/icons/Book'
import type { Rule } from 'sanity'
import { defineType } from 'sanity'
import {
  academicFields,
  academicGrouping,
  academicPreview,
} from '../common/academicFields'
import { validationRules } from '../validation'

const ENTITY = 'subject'

export const Subject = defineType({
  // Editorial record for a subject; the runtime identity lives in Postgres, linked via dbId.
  name: 'subject',
  title: 'Subject',
  type: 'document',
  icon: BookIcon,
  ...academicPreview(),
  ...academicGrouping(ENTITY),
  fields: [
    ...academicFields(ENTITY, ['name', 'slug']),
    {
      name: 'code',
      title: 'Course Code',
      description: 'Course or catalog code (e.g., CS101, BIO201).',
      type: 'string',
      fieldset: 'information',
      group: 'information',
      validation: validationRules.isRequired,
    },
    ...academicFields(ENTITY, ['description', 'keywords'], {
      overrides: { description: { required: true } },
    }),
    {
      name: 'credits',
      title: 'ECTS Credits',
      description: 'Academic credit points for this course.',
      type: 'number',
      validation: validationRules.isRequired,
      fieldset: 'academic',
      group: 'academic',
    },
    {
      name: 'year',
      title: 'Year',
      type: 'number',
      description: 'Used to create the database record (1-8).',
      validation: (rule: Rule) => rule.required().min(1).max(8),
      fieldset: 'academic',
      group: 'academic',
    },
    {
      name: 'classes',
      title: 'Classes',
      type: 'string',
      description: 'Class amount for this course (e.g., 3 + 3).',
      fieldset: 'academic',
      group: 'academic',
    },
    {
      name: 'semester',
      title: 'Semester',
      type: 'string',
      description: 'Semester during which the course is offered.',
      options: {
        list: [
          { title: 'Winter Semester', value: 'winter' },
          { title: 'Summer Semester', value: 'summer' },
        ],
      },
      initialValue: 'winter',
      validation: validationRules.isRequired,
      fieldset: 'academic',
      group: 'academic',
    },

    {
      name: 'professors',
      title: 'Professors',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'professor' }],
        },
      ],
      description:
        'Assign one or more professors to this subject in the database.',
      validation: (rule: Rule) => rule.required().min(1),
      fieldset: 'database',
      group: 'database',
    },
    {
      name: 'study',
      title: 'Study',
      type: 'reference',
      to: [{ type: 'study' }],
      description:
        'Used to create the database record. The faculty is inherited from the selected study.',
      validation: validationRules.isRequired,
      // TODO: Check if professor is assigned to the selected study
      fieldset: 'database',
      group: 'database',
    },
    ...academicFields(ENTITY, ['dbId']),
  ],
})
