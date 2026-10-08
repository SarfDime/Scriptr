import BookIcon from '@sanity/icons/Book'
import { Page } from '../schemas/pages/page'
import type { StructureToolTypes } from '../types/common.types'
import { createColoredIcon } from './icon-helpers'

/** Builds the structure for the "Pages" list*/
export const buildPageStructure = async (
  build: StructureToolTypes['Build']
) => {
  return build
    .list()
    .title('Pages')
    .items([
      build
        .listItem()
        .title('All Pages')
        .icon(createColoredIcon(BookIcon, 'pages'))
        .child(build.documentTypeList(Page.name).title('All Pages on website')),
    ])
}
