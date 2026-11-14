import { UserIcon } from '@sanity/icons/User'
import { defineType } from 'sanity'

import { localizedField } from '../common/localeFields'
import { validationRules } from '../validation'

export const Person = defineType({
  name: 'person',
  title: 'Person',
  type: 'document',
  icon: UserIcon,
  preview: {
    select: {
      name: 'localizedName.en',
      nameMk: 'localizedName.mk',
      media: 'picture',
      personTitle: 'localizedTitle.en',
      personTitleMk: 'localizedTitle.mk',
    },
    prepare: ({ name, nameMk, media, personTitle, personTitleMk }) => ({
      title: name || nameMk || 'Untitled person',
      subtitle: personTitle || personTitleMk || undefined,
      media,
    }),
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
    localizedField({
      name: 'localizedName',
      title: `Person's name and surname`,
      description: 'The full name and surname of the person.',
      valueType: 'string',
      isRequired: true,
    }),
    localizedField({
      name: 'localizedTitle',
      title: `Person's title`,
      valueType: 'string',
      isRequired: true,
    }),
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
      type: 'url',
      validation: validationRules.isRequired,
    },
    localizedField({
      name: 'localizedDescription',
      title: `Person's description`,
      valueType: 'richTextLite',
    }),
  ],
})
