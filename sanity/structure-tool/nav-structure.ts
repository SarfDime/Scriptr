import { MasterDetailIcon } from '@sanity/icons/MasterDetail'
import type { StructureToolTypes } from '../types/common.types'
import type { ChildSchemaType } from '../types/schema-prop.types'
import { createColoredIcon } from './icon-helpers'

const navigationSchemas: Array<ChildSchemaType> = [
  {
    title: 'Nav Menu',
    schemaType: 'navMenu',
    category: 'navigation',
    icon: MasterDetailIcon,
  },
  {
    title: 'Nav Item',
    schemaType: 'navItem',
    category: 'navigation',
    icon: MasterDetailIcon,
  },
]

/** Custom structure tool for navigation schema types.
 *
 * This structure tool creates a custom menu with the following items:
 *
 * - Navigation & Routing: A list of all navigation schema types.
 */
export const buildNavigationStructure = (build: StructureToolTypes['Build']) =>
  build
    .list()
    .title('Navigation & Routing')
    .items([
      ...navigationSchemas.map((item) => {
        return build
          .listItem()
          .icon(createColoredIcon(item.icon, item.category ?? 'navigation'))
          .title(item.title)
          .child(build.documentTypeList(item.schemaType))
      }),
    ])
