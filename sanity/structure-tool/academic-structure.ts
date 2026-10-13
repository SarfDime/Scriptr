import Book from '@sanity/icons/Book'
import Calendar from '@sanity/icons/Calendar'
import Clock from '@sanity/icons/Clock'
import Component from '@sanity/icons/Component'
import Controls from '@sanity/icons/Controls'
import Documents from '@sanity/icons/Documents'
import EarthAmericas from '@sanity/icons/EarthAmericas'
import Users from '@sanity/icons/Users'

import type { StructureToolTypes } from '../types/common.types'
import type { ChildSchemaType } from '../types/schema-prop.types'
import { createColoredIcon } from './icon-helpers'

// ==========================================
// 1. TYPE DEFINITIONS
// ==========================================

// Defines a standard filtered list view
type FilterOption = {
  type?: 'filter'
  title: string
  filter: string
  icon?: ReturnType<typeof createColoredIcon>
  params?: Record<string, unknown>
}

// Defines a visual divider in the menu
type DividerOption = {
  type: 'divider'
  title?: string
}

// Extends your existing ChildSchemaType to support filters & dividers
type SectionConfig = ChildSchemaType & {
  filters?: Array<FilterOption | DividerOption>
}

// ==========================================
// 2. CONFIGURATION
// ==========================================

const academicSections: Array<SectionConfig> = [
  {
    title: 'Professor',
    schemaType: 'professor',
    category: 'people',
    icon: Users,
    filters: [
      { type: 'divider', title: 'DB' },
      {
        title: 'Connected',
        filter: '_type == "professor" && dbId != null',
        icon: createColoredIcon(Documents, 'info'),
      },
      {
        title: 'Not Connected',
        filter: '_type == "professor" && dbId == null',
        icon: createColoredIcon(Controls, 'interactive'),
      },
    ],
  },
  {
    title: 'Faculty',
    schemaType: 'faculty',
    category: 'team',
    icon: Component,
  },
  {
    title: 'Study',
    schemaType: 'study',
    category: 'sections',
    icon: Book,
  },
  {
    title: 'Subject',
    schemaType: 'subject',
    category: 'info',
    icon: Documents,
    filters: [
      {
        title: 'All Subjects',
        filter: '_type == "subject"',
        icon: createColoredIcon(Documents, 'info'),
      },
      {
        title: 'Elective Subjects',
        filter: '_type == "subject" && elective == true',
        icon: createColoredIcon(Controls, 'interactive'),
      },
      { type: 'divider', title: 'Years' },
      ...[1, 2, 3].map((year) => ({
        title: `Year ${year}`,
        filter: '_type == "subject" && year == $year',
        icon: createColoredIcon(Calendar, 'content'),
        params: { year },
      })),
      { type: 'divider', title: 'Semesters' },
      ...[1, 2, 3, 4, 5, 6].map((semester) => ({
        title: `Semester ${semester}`,
        filter: '_type == "subject" && semester == $semester',
        icon: createColoredIcon(Clock, 'utility'),
        params: { semester },
      })),
    ],
  },
  {
    title: 'University',
    schemaType: 'university',
    category: 'website',
    icon: EarthAmericas,
  },
]

// ==========================================
// 3. STRUCTURE BUILDER FUNCTION
// ==========================================

/**
 * A structure tool that generates a list of all section schemas.
 */
export const buildAcademicStructure = (build: StructureToolTypes['Build']) =>
  academicSections.map((item) => {
    // Generate the base icon for the parent list item
    const icon = createColoredIcon(item.icon, item.category ?? 'utility')

    if (item.filters && item.filters.length > 0) {
      return build
        .listItem()
        .title(item.title)
        .icon(icon)
        .child(
          build
            .list()
            .title(`${item.title} Views`)
            .items(
              item.filters.map((filterItem) => {
                // Divider logic: includes .title() as requested
                if ('type' in filterItem && filterItem.type === 'divider') {
                  return build.divider().title(filterItem?.title ?? '')
                }

                // Normal list item logic
                return build
                  .listItem()
                  .title(filterItem.title)
                  .icon(filterItem.icon ?? icon)
                  .child(
                    build
                      .documentList()
                      .title(filterItem.title)
                      .filter(filterItem.filter)
                      .params(filterItem.params || {})
                  )
              })
            )
        )
    }

    return build
      .listItem()
      .icon(icon)
      .title(item.title)
      .child(build.documentTypeList(item.schemaType))
  })
