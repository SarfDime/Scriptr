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
      media: 'picture',
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
      name: 'email',
      title: `Person's email`,
      type: 'string',
    },
    {
      name: 'academicRank',
      title: `Person's academic rank`,
      type: 'string',
    },
    {
      name: 'scientificField',
      title: `Person's scientific field`,
      type: 'string',
    },
    {
      name: 'website',
      title: `Person's website`,
      type: 'url', // Deferred: replace with the link-selector custom link.
      validation: validationRules.isRequired,
    },
    {
      name: 'description',
      title: `Person's description`,
      type: 'richTextLite',
    },
  ],
})
