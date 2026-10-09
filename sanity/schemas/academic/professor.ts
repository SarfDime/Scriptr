import UserIcon from '@sanity/icons/User'
import type {
  ReferenceFilterResolverContext,
  Rule,
  ValidationContext,
} from 'sanity'
import { defineType } from 'sanity'
import {
  academicFields,
  academicGrouping,
  academicPreview,
} from '../common/academicFields'
import { filterExistingReferences } from '../util-functions/schemaFilters'

const ENTITY = 'professor'
type ReferenceItem = { _ref: string }
type ProfessorDocument = { faculties?: Array<ReferenceItem> }
type ProfessorStudyFilterContext = Pick<
  ReferenceFilterResolverContext,
  'getClient'
> & {
  document: ProfessorDocument
  parent: Array<ReferenceItem>
}

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
      validation: (rule: Rule) =>
        rule.required().min(1).custom(validateFacultyUniversities),
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
            filter: ({ document, parent }: ProfessorStudyFilterContext) => {
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

async function validateFacultyUniversities(
  value: unknown,
  context: ValidationContext
) {
  if (!Array.isArray(value) || value.length < 2) return true

  const facultyIds = value.flatMap((item) =>
    typeof item === 'object' &&
    item !== null &&
    '_ref' in item &&
    typeof item._ref === 'string'
      ? [item._ref]
      : []
  )
  if (facultyIds.length < 2) return true

  const client = context.getClient({ apiVersion: '2025-01-01' })
  const universities = await client.fetch<Array<string | null>>(
    '*[_id in $facultyIds].university._ref',
    { facultyIds }
  )
  const uniqueUniversities = new Set(universities.filter(Boolean))

  return uniqueUniversities.size <= 1
    ? true
    : 'All assigned faculties must belong to the same university.'
}
