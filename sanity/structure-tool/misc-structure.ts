import EllipsisVerticalIcon from '@sanity/icons/EllipsisVertical'
import InfoOutlineIcon from '@sanity/icons/InfoOutline'
import MasterDetailIcon from '@sanity/icons/MasterDetail'
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
    title: 'Info Block',
    schemaType: 'infoBlock',
    category: 'content',
    icon: InfoOutlineIcon,
  },
]

// Navigation & Routing
const navigationSchemas: Array<ChildSchemaType> = [
  {
    title: 'Navigation Item',
    schemaType: 'navigationItem',
    category: 'navigation',
    icon: MasterDetailIcon,
  },
]

// People & Social
const peopleSchemas: Array<ChildSchemaType> = [
  { title: 'Person', schemaType: 'person', category: 'people', icon: UserIcon },
  {
    title: 'SubMenu Item',
    schemaType: 'subMenuItem',
    category: 'people',
    icon: EllipsisVerticalIcon,
  },
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
      build.divider().title('Navigation & Routing'),
      ...navigationSchemas.map((item) => {
        return build
          .listItem()
          .icon(createColoredIcon(item.icon, item.category ?? 'navigation'))
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
