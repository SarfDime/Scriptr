import InfoOutlineIcon from '@sanity/icons/InfoOutline'
import UserIcon from '@sanity/icons/User'
import { ButtonIcon } from '../components/Icons'
import type { StructureToolTypes } from '../types/common.types'
import type { ChildSchemaType } from '../types/schema-prop.types'
import { createColoredIcon } from './icon-helpers'

// Content & Display Components
const contentSchemas: Array<ChildSchemaType> = [
  {
    title: 'Button custom type',
    schemaType: 'button',
    category: 'content',
    icon: ButtonIcon,
  },
  {
    title: 'Christmas Canvas',
    schemaType: 'christmasCanvas',
    category: 'content',
    icon: InfoOutlineIcon,
  },
  {
    title: 'Skybox',
    schemaType: 'skybox',
    category: 'content',
    icon: InfoOutlineIcon,
  },
]

// People & Social
const peopleSchemas: Array<ChildSchemaType> = [
  { title: 'Person', schemaType: 'person', category: 'people', icon: UserIcon },
]

/** Custom structure tool for miscellaneous schema types.
 *
 * This structure tool creates a custom menu with the following items:
 *
 * - Miscellaneous Schema Types: A list of all miscellaneous schema types.
 * - Webschemas: A list of all webschemas.
 */
export const buildMiscellaneousStructure = (
  build: StructureToolTypes['Build']
) =>
  build
    .list()
    .title('Miscellaneous Schema Types')
    .items([
      build.divider().title('Content & Display Components'),
      ...contentSchemas.map((item) => {
        return build
          .listItem()
          .icon(createColoredIcon(item.icon, item.category ?? 'content'))
          .title(item.title)
          .child(build.documentTypeList(item.schemaType))
      }),
      build.divider().title('People & Social'),
      ...peopleSchemas.map((item) => {
        return build
          .listItem()
          .icon(createColoredIcon(item.icon, item.category ?? 'people'))
          .title(item.title)
          .child(build.documentTypeList(item.schemaType))
      }),
    ])
