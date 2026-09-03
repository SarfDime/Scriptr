import BookIcon from '@sanity/icons/Book'
import type { StructureToolTypes } from '../types/common.types'
import { createColoredIcon } from './icon-helpers'

/** Builds the structure for the "Pages" list*/
export const buildPageStructure = async (
  build: StructureToolTypes['Build']
) => {
  const pageType = 'page' // TODO: Import type from schema

  return build
    .list()
    .title('Pages')
    .items([
      build
        .listItem()
        .title('All Pages')
        .icon(createColoredIcon(BookIcon, 'pages'))
        .child(build.documentTypeList(pageType).title('All Pages on website')),
    ])
}
