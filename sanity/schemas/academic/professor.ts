import UserIcon from '@sanity/icons/User'
import type { Rule } from 'sanity'
import { defineType } from 'sanity'
import {
  academicFields,
  academicGrouping,
  academicPreview,
} from '../common/academicFields'
import { filterExistingReferences } from '../util-functions/schemaFilters'

const ENTITY = 'professor'

export const Professor = defineType({
  // Editorial record for a professor; the runtime identity lives in Postgres, linked via dbId.
  name: 'professor',
  title: 'Professor',
  type: 'document',
  icon: UserIcon,
  ...academicPreview({
    icon: UserIcon,
  }),
  ...academicGrouping(ENTITY),
  fields: [
    ...academicFields(ENTITY, ['name', 'slug', 'title', 'description']),
    ...academicFields(
      ENTITY,
      ['picture', 'bio', 'office', 'telephone', 'email', 'website'],
      {
        overrides: {
          website: {
            description: 'Enter the personal or faculty profile website URL.',
          },
        },
      }
    ),
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
      validation: (rule: Rule) => rule.required().min(1), // Deferred: constrain faculties to one university.
      fieldset: 'database',
      group: 'database',
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
              // Deferred: replace this callback's inferred value with a schema type.
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
      group: 'database',
    },
    ...academicFields(ENTITY, ['dbId']),
  ],
})
