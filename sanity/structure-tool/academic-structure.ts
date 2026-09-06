import { BlockElementIcon } from '@sanity/icons/BlockElement'
import { DocumentTextIcon } from '@sanity/icons/DocumentText'
import type { StructureToolTypes } from '../types/common.types'
import type { ChildSchemaType } from '../types/schema-prop.types'
import { createColoredIcon } from './icon-helpers'

const academicSections: Array<ChildSchemaType> = [
  {
    title: 'Professor',
    schemaType: 'professor',
    category: 'info',
    icon: DocumentTextIcon,
  },
  {
    title: 'Faculty',
    schemaType: 'faculty',
    category: 'info',
    icon: BlockElementIcon,
  },
  {
    title: 'Subject',
    schemaType: 'subject',
    category: 'info',
    icon: BlockElementIcon,
  },
  {
    title: 'University',
    schemaType: 'university',
    category: 'info',
    icon: BlockElementIcon,
  },
]

/** A structure tool that generates a list of all section schemas.
 *
 * It creates a custom menu with the following items:
 *
 * - Section Types: A list of all section schemas, each as a separate item.
 */
export const buildAcademicStructure = (build: StructureToolTypes['Build']) =>
  build
    .list()
    .title('Academic')
    .items([
      build.divider().title('Academic Sections'),
      ...academicSections.map((item) => {
        return build
          .listItem()
          .icon(createColoredIcon(item.icon, item.category ?? 'utility'))
          .title(item.title)
          .child(build.documentTypeList(item.schemaType))
      }),
    ])
