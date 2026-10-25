import BlockElementIcon from '@sanity/icons/BlockElement'
import BookIcon from '@sanity/icons/Book'
import BulbOutlineIcon from '@sanity/icons/BulbOutline'
import EarthGlobeIcon from '@sanity/icons/EarthGlobe'
import MasterDetailIcon from '@sanity/icons/MasterDetail'
import MenuIcon from '@sanity/icons/Menu'

import type { StructureToolTypes } from '../types/common.types'
import { buildAcademicStructure } from './academic-structure'
import { createColoredIcon } from './icon-helpers'
import { buildMiscellaneousStructure } from './misc-structure'
import { buildNavigationStructure } from './nav-structure'
import { buildPageStructure } from './page-structure'
import { buildSectionsStructure } from './sections-structure'

/**
 * Custom structure tool for the Scriptr CMS.
 *
 * This structure tool creates a custom menu with the following items:
 *
 * - Website: A list of all websites
 * - Pages: A list of all pages. Pages are categorized based on usage.
 * - Navigation Menu: A list of all navigation menus
 * - Sections: A list of all content sections
 * - Footer: A list of all footers
 * - Study tips: A list of all study tips (Sanity-only content)
 * - Content Sections: A list of all content sections and separate Lists for all content post types
 * - Miscellaneous: A list of all miscellaneous documents alongside webschemas for website
 */
export const customStructureTool = (build: StructureToolTypes['Build']) =>
  build
    .list()
    .title('Scriptr')
    .items([
      build
        .listItem()
        .icon(createColoredIcon(EarthGlobeIcon, 'website'))
        .title('Website')
        .child(build.documentTypeList('website')),

      build
        .listItem()
        .icon(createColoredIcon(BookIcon, 'pages'))
        .title('Pages')
        .child(() => buildPageStructure(build)),

      build.divider().title('Navigation & Layout'),

      build
        .listItem()
        .icon(createColoredIcon(MenuIcon, 'navigationMenu'))
        .title('Navigation')
        .child(buildNavigationStructure(build)),

      build
        .listItem()
        .icon(createColoredIcon(BlockElementIcon, 'sections'))
        .title('Sections')
        .child(buildSectionsStructure(build)),

      build
        .listItem()
        .icon(createColoredIcon(MenuIcon, 'footer'))
        .title('Footer')
        .child(build.documentTypeList('footer')),

      build
        .listItem()
        .icon(createColoredIcon(BulbOutlineIcon, 'content'))
        .title('Study tips')
        .child(build.documentTypeList('studyTip')),

      build.divider().title('Misc Content'),

      build
        .listItem()
        .icon(createColoredIcon(MasterDetailIcon, 'misc'))
        .title('Miscellaneous')
        .child(buildMiscellaneousStructure(build)),

      build.divider().title('Academic Sections'),

      // build
      //   .listItem()
      //   .icon(createColoredIcon(BlockElementIcon, 'sections'))
      //   .title('Academic')
      //   .child(buildAcademicStructure(build)),
      ...buildAcademicStructure(build),
    ])
