import LinkIcon from '@sanity/icons/Link'
import { defineType } from 'sanity'
import { headerSchemaFields } from '../common/headerFields'
import { linkSelector } from '../common/linkSelector'
import { filterExistingReferences } from '../util-functions/schemaFilters'
import {
  generateLinkSelectorPreview,
  LinkSelectorPreviewSelect,
} from '../util-functions/utilFunctions'

export const NavigationItem = defineType({
  // Schema for "Navigation Item"
  name: 'navigationItem',
  title: 'Navigation Item',
  type: 'document',
  icon: LinkIcon,
  preview: {
    select: { ...LinkSelectorPreviewSelect, title: 'stringTitle.en' },
    prepare: generateLinkSelectorPreview,
  },
  fields: [
    ...headerSchemaFields({
      title: 'Navigation item title',
      type: 'string',
      description: 'The title of the navigation item.',
    }),

    ...linkSelector,
    {
      // Field for secondary navigation items
      title: 'Secondary navigation',
      name: 'navigationSubMenuItems',
      type: 'array',
      description:
        'An array of sub-menu items associated with a specific navigation item.',
      of: [
        {
          type: 'reference',
          options: {
            filter: filterExistingReferences,
          },
          to: [
            {
              type: 'subMenuItem',
            },
          ],
        },
      ],
    },
  ],
})
