import { defineType } from 'sanity'
import { Link } from 'sanity/router'
import { headerSchemaFields } from '../common/headerFields'
import { linkSelector } from '../common/link-selector'
import {
  generateLocalizedHeaderPreview,
  LocalizedHeaderPreviewSelect,
} from '../util-functions/utilFunctions'

export const NavItem = defineType({
  name: 'navItem',
  title: 'Navigation Item',
  type: 'document',
  icon: Link,
  preview: {
    select: LocalizedHeaderPreviewSelect,
    prepare: generateLocalizedHeaderPreview,
  },
  fields: [
    ...headerSchemaFields({
      title: 'Navigation item title',
      type: 'string',
      description: 'The title of the navigation item.',
      icon: {
        showIcon: true,
      },
    }),

    ...linkSelector,
  ],
})
