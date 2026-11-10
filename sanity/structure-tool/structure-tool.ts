import BulbOutlineIcon from '@sanity/icons/BulbOutline'
import CalendarIcon from '@sanity/icons/Calendar'
import EarthGlobeIcon from '@sanity/icons/EarthGlobe'
import MasterDetailIcon from '@sanity/icons/MasterDetail'
import MenuIcon from '@sanity/icons/Menu'
import type { StructureToolTypes } from '../types/common.types'
import { buildAcademicStructure } from './academic-structure'
import { buildCalendarStructure } from './calendar-structure'
import { createColoredIcon } from './icon-helpers'
import { buildMiscellaneousStructure } from './misc-structure'
import { buildNavigationStructure } from './nav-structure'

/**
 * Custom structure tool for the Scriptr CMS.
 *
 * This structure tool creates a custom menu with the following items:
 *
 * - Website: A list of all websites
 * - Navigation Menu: A list of all navigation menus
 * - Study tips: A list of all study tips (Sanity-only content)
 * - Calendar: Calendars and their events
 * - Miscellaneous: Miscellaneous documents alongside the website's schemas
 * - Academic: The academic catalogue entities
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

      build.divider().title('Navigation & Layout'),

      build
        .listItem()
        .icon(createColoredIcon(MenuIcon, 'navigationMenu'))
        .title('Navigation')
        .child(buildNavigationStructure(build)),

      build
        .listItem()
        .icon(createColoredIcon(BulbOutlineIcon, 'content'))
        .title('Study tips')
        .child(build.documentTypeList('studyTip')),

      build
        .listItem()
        .icon(createColoredIcon(CalendarIcon, 'content'))
        .title('Calendar')
        .child(buildCalendarStructure(build)),

      build.divider().title('Misc Content'),

      build
        .listItem()
        .icon(createColoredIcon(MasterDetailIcon, 'misc'))
        .title('Miscellaneous')
        .child(buildMiscellaneousStructure(build)),

      build.divider().title('Academic Sections'),

      ...buildAcademicStructure(build),
    ])
