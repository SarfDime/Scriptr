import UserIcon from '@sanity/icons/User'
import type { Rule } from 'sanity'
import { defineType } from 'sanity'
import { customLinkField } from '../common/customLink'
import { filterExistingReferences } from '../util-functions/schemaFilters'
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
  fieldsets: [
    {
      name: 'information',
      title: 'Information',
      description: 'General information for the professor.',
    },
    {
      name: 'contactInfo',
      title: 'Contact Information',
      description: 'Contact details for the professor.',
    },
    {
      name: 'database',
      title: 'Database',
      description: 'Database details for the professor.',
    },
  ],
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: validationRules.isRequired,
      fieldset: 'information',
    },
    {
      name: 'title',
      title: 'Academic Title',
      description:
        'Academic rank or title (e.g., Professor, Associate Professor, Assistant Professor, Lecturer).',
      type: 'string',
      fieldset: 'information',
    },
    {
      name: 'picture',
      title: 'Picture',
      type: 'image',
      options: { hotspot: true },
      fieldset: 'information',
    },
    {
      name: 'bio',
      title: 'Bio',
      type: 'richTextLite',
      fieldset: 'information',
    },
    {
      name: 'office',
      title: 'Office / Room',
      description: 'Office or room location for consultations.',
      type: 'string',
      fieldset: 'contactInfo',
    },
    {
      name: 'telephone',
      title: 'Telephone',
      type: 'string',
      fieldset: 'contactInfo',
    },
    {
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (rule: Rule) => rule.email(),
      fieldset: 'contactInfo',
    },
    customLinkField({
      name: 'website',
      title: 'Website',
      description: 'Enter the personal or faculty profile website URL.',
      fieldset: 'contactInfo',
    }),
    {
      name: 'faculties',
      title: 'Faculties',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'faculty' }],
          options: {
            filter: filterExistingReferences,
            disableNew: true,
          },
        },
      ],
      description:
        'Assign this professor to one or more faculties in the database.',
      validation: (rule: Rule) => rule.required().min(1),
      fieldset: 'database',
    },
    {
      name: 'studies',
      title: 'Studies',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'study' }],
          options: {
            disableNew: true,
            // Combines existing reference filter with faculty check
            filter: ({
              document,
              parent,
            }: {
              document: { faculties?: Array<{ _ref: string }> }
              parent: Array<{ _ref: string }>
              // TODO: Type Properly
            }) => {
              // 1. Get currently chosen faculty IDs
              const selectedFacultyIds =
                document?.faculties?.map((f) => f._ref).filter(Boolean) || []

              // 2. Get already chosen study IDs (replaces filterExistingReferences)
              const existingIds =
                parent?.map((p) => p._ref).filter(Boolean) || []

              return {
                filter:
                  'faculty._ref in $selectedFacultyIds && !(_id in $existingIds) && !(_id in path("drafts.**"))',
                params: { selectedFacultyIds, existingIds },
              }
            },
          },
        },
      ],
      fieldset: 'database',
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
      fieldset: 'database',
    },
  ],
})
