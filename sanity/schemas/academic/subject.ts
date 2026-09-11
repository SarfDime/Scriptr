import BookIcon from '@sanity/icons/Book'
import type { Rule } from 'sanity'
import { defineType } from 'sanity'
import {
  academicDescriptionField,
  academicNameField,
  academicSlugField,
  databaseIdField,
} from '../common/academicFields'
import { customLinkField } from '../common/customLink'
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
  fieldsets: [
    {
      name: 'information',
      title: 'Information',
      description: 'General information for the subject.',
    },
    {
      name: 'academic',
      title: 'Academic',
      description: 'Academic curriculum details for the subject.',
    },
    {
      name: 'database',
      title: 'Database',
      description: 'Database details for the subject.',
    },
  ],
  fields: [
    academicNameField({ fieldset: 'information' }),
    academicSlugField({ hierarchy: 'subject' }),
    {
      name: 'code',
      title: 'Course Code',
      description: 'Course or catalog code (e.g., CS101, BIO201).',
      type: 'string',
      fieldset: 'information',
      validation: validationRules.isRequired,
    },
    academicDescriptionField({ fieldset: 'information', required: true }),
    {
      name: 'keywords',
      title: 'Keywords',
      description: 'Keywords or tags associated with the subject.',
      type: 'array',
      of: [{ type: 'string' }],
      fieldset: 'information',
    },
    {
      name: 'credits',
      title: 'ECTS Credits',
      description: 'Academic credit points for this course.',
      type: 'number',
      fieldset: 'information',
      validation: validationRules.isRequired,
    },
    customLinkField({
      name: 'syllabus',
      title: 'Syllabus Link',
      description: 'Link to official course syllabus or curriculum document.',
      fieldset: 'information',
    }),
    {
      name: 'year',
      title: 'Year',
      type: 'number',
      description: 'Used to create the database record (1-8).',
      validation: (rule: Rule) => rule.required().min(1).max(8),
      fieldset: 'academic',
    },
    {
      name: 'classes',
      title: 'Classes',
      type: 'string',
      description: 'Class amount for this course (e.g., 3 + 3).',
      fieldset: 'academic',
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
      fieldset: 'academic',
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
    },
    databaseIdField({ fieldset: 'database' }),
  ],
})
