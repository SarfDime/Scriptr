import { UserIcon } from '@sanity/icons/User'
import { defineType } from 'sanity'

import { validationRules } from '../validation'

export const Person = defineType({
  name: 'person',
  title: 'Person',
  type: 'document',
  icon: UserIcon,
  preview: {
    select: {
      title: 'name',
      media: 'image',
      subtitle: 'title',
    },
  },
  fields: [
    {
      name: 'picture',
      title: `Person's image`,
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'name',
      title: `Person's name and surname`,
      description: 'The full name and surname of the person.',
      type: 'string',
      validation: validationRules.isRequired,
    },
    {
      name: 'title',
      title: `Person's title`,
      type: 'string',
      validation: validationRules.isRequired,
    },
    {
      name: 'description',
      title: `Person's description`,
      type: 'richTextLite',
    },
  ],
})
