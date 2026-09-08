import { defineType } from 'sanity'
import { internalUseTitle } from '../common/headerFields'
import { filterExistingReferences } from '../util-functions/schemaFilters'

export const NavMenu = defineType({
  title: 'Nav Menu',
  name: 'navMenu',
  type: 'document',
  preview: {
    select: {
      title: 'title',
      media: 'websiteLogo',
    },
  },
  fields: [
    internalUseTitle,
    {
      title: 'Logo',
      name: 'websiteLogo',
      type: 'image',
      description:
        'The main navigation logo displayed on the left side of the navigation bar.',
      options: {
        hotspot: true,
      },
    },

    {
      title: 'Nav bar items',
      name: 'navItems',
      type: 'array',
      description: 'List of items displayed in the navigation bar.',
      of: [
        {
          type: 'reference',
          options: {
            filter: filterExistingReferences,
          },
          to: [
            {
              type: 'navItem',
            },
          ],
        },
      ],
    },
  ],
})
