import { UserIcon } from '@sanity/icons/User'
import { defineType } from 'sanity'

import { validationRules } from '../validation'

export const Person = defineType({
  // Schema for "Employee or Advisor" that appears in about us -> team
  name: 'person',
  title: 'Person',
  type: 'document',
  icon: UserIcon,
  preview: {
    select: {
      title: 'personName',
      media: 'personImage',
      subtitle: 'personTitle',
    },
  },
  fields: [
    {
      // Field for person's image
      name: 'personImage',
      title: `Person's image`,
      description:
        'An image that visually represents the person on the website.',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      // Field for person's alternative image
      name: 'personAlternativeImage',
      title: `Person's alternative image`,
      description:
        'An alternative or AI generated image that visually represents the person on the website.',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      // Field for person's name and surname
      name: 'personName',
      title: `Person's name and surname`,
      description: 'The full name and surname of the person.',
      type: 'string',
      validation: validationRules.isRequired,
    },
    {
      // Field that describes a person's title
      name: 'personTitle',
      title: `Person's title`,
      description: `The person's title or occupation, which provides context about their expertise or background.`,
      type: 'string',
      validation: validationRules.isRequired,
    },
    {
      // Field for a person's description
      name: 'personDescription',
      title: `Person's description`,
      description:
        'Additional information about the person, such as their background, accomplishments, or other relevant details.',
      type: 'richTextLite',
    },
  ],
})
