import BookIcon from '@sanity/icons/Book'
import type { Rule } from 'sanity'
import { defineType } from 'sanity'
import {
  academicFields,
  academicGrouping,
  academicPreview,
} from '../common/academicFields'
import { customLinkField } from '../common/customLink'
import { validationRules } from '../validation'

const ENTITY = 'subject'

export const Subject = defineType({
  // Editorial record for a subject; the runtime identity lives in Postgres, linked via dbId.
  name: 'subject',
  title: 'Subject',
  type: 'document',
  icon: BookIcon,
  ...academicPreview({
    isSubject: true,
    selectExtra: {
      code: 'code',
      year: 'year',
      semester: 'semester',
      elective: 'elective',
    },
    formatSubtitle: (selection) => {
      const { code, year, semester, elective } = selection as {
        code?: string
        year?: number
        semester?: number
        elective?: boolean
      }
      const parts: Array<string> = []
      if (code) parts.push(code)
      if (elective) parts.push('Elective')
      if (year) parts.push(`${year}`)
      if (semester) parts.push(`${semester}`)
      return parts.length > 0 ? parts.join(' • ') : undefined
    },
  }),
  ...academicGrouping(ENTITY),
  orderings: [
    {
      title: 'Year (Newest First)',
      name: 'yearDesc',
      by: [{ field: 'year', direction: 'desc' }],
    },
    {
      title: 'Year (Oldest First)',
      name: 'yearAsc',
      by: [{ field: 'year', direction: 'asc' }],
    },
  ],
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
      name: 'elective',
      title: 'Elective',
      type: 'boolean',
      description: 'Indicates if this course is elective.',
      initialValue: false,
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
      type: 'number',
      description: 'Semester during which the course is offered.',
      validation: (rule: Rule) => rule.required().min(1).max(10),
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
    customLinkField({
      name: 'syllabus',
      title: 'Syllabus',
      description: `Enter a URL containing this subject syllabus.`,
      grouping: 'academic',
      validation: (rule) => validationRules.urlValidation(rule, false),
    }),
    {
      name: 'study',
      title: 'Study',
      type: 'reference',
      to: [{ type: 'study' }],
      description:
        'Used to create the database record. The faculty is inherited from the selected study.',
      validation: validationRules.isRequired,
      // Deferred: validate that assigned professors belong to the selected study.
      fieldset: 'database',
      group: 'database',
    },
    ...academicFields(ENTITY, ['dbId']),
  ],
})
