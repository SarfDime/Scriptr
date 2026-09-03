import { BlockContentIcon } from '@sanity/icons/BlockContent'
import { BlockElementIcon } from '@sanity/icons/BlockElement'
import { DocumentTextIcon } from '@sanity/icons/DocumentText'
import type { StructureToolTypes } from '../types/common.types'
import type { ChildSchemaType } from '../types/schema-prop.types'
import { createColoredIcon } from './icon-helpers'

const infoSections: Array<ChildSchemaType> = [
  {
    title: 'Info block section',
    schemaType: 'infoBlockSection',
    category: 'info',
    icon: DocumentTextIcon,
  },
  {
    title: 'Info hub section',
    schemaType: 'infoHubSection',
    category: 'info',
    icon: BlockElementIcon,
  },
]

const utilitySections: Array<ChildSchemaType> = [
  {
    title: 'Markdown section',
    schemaType: 'markdownSection',
    category: 'utility',
    icon: BlockContentIcon,
  },
]

export const sectionSchemas: Array<ChildSchemaType> = [
  ...infoSections,
  ...utilitySections,
]

export const allSectionTypes = sectionSchemas
  .map((section) => {
    return { type: section.schemaType }
  })
  .concat([{ type: 'footer' }])

/** A structure tool that generates a list of all section schemas.
 *
 * It creates a custom menu with the following items:
 *
 * - Section Types: A list of all section schemas, each as a separate item.
 */
export const buildSectionsStructure = (build: StructureToolTypes['Build']) =>
  build
    .list()
    .title('Section Types')
    .items([
      build.divider().title('Utilities'),
      ...utilitySections.map((item) => {
        return build
          .listItem()
          .icon(createColoredIcon(item.icon, item.category ?? 'utility'))
          .title(item.title)
          .child(build.documentTypeList(item.schemaType))
      }),

      build.divider().title('Information Content'),
      ...infoSections.map((item) => {
        return build
          .listItem()
          .icon(createColoredIcon(item.icon, item.category ?? 'info'))
          .title(item.title)
          .child(build.documentTypeList(item.schemaType))
      }),
    ])
