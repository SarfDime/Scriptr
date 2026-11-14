import { defineType } from 'sanity'
import { headerSchemaFields } from '../common/headerFields'
import { linkSelector } from '../common/link-selector'
import {
  generateLocalizedHeaderPreview,
  LocalizedHeaderPreviewSelect,
} from '../util-functions/utilFunctions'

export const SubMenuItem = defineType({
  name: 'subMenuItem',
  title: 'Sub-Menu Item',
  type: 'document',
  groups: [
    {
      name: 'subMenuItemLinkData',
      title: 'Submenu item link settings',
    },
  ],
  preview: {
    select: LocalizedHeaderPreviewSelect,
    prepare: generateLocalizedHeaderPreview,
  },
  fields: [
    ...headerSchemaFields({
      title: 'Submenu item title',
      description: 'The title of the submenu section.',
      subtitle: {
        type: 'richTextLite',
        showSubtitle: true,
        title: 'Sub menu item description',
        description: 'A brief description of the submenu item.',
      },
      icon: {
        showIcon: true,
        title: 'Sub menu item icon',
        description: 'An icon that represents the submenu item.',
        isRequired: true,
      },
    }),

    ...linkSelector,
  ],
})
