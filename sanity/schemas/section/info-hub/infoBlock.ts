import { defineType } from 'sanity'
import { headerSchemaFields } from '../../common/headerFields'
import { slugSchemaField } from '../../common/slug'
import { createSectionPreview } from '../../util-functions/utilFunctions'

export const InfoBlock = defineType({
  name: 'infoBlock',
  title: 'Info block',
  type: 'document',
  preview: createSectionPreview({ subtitle: 'subtitle' }),
  fields: [
    ...headerSchemaFields({
      title: 'Info block title',
      description: 'Title field for the info block, rendered beneath the icon.',
      icon: {
        showIcon: true,
        title: 'Info block icon',
        description: 'Icon that should be rendered at the on top of the title.',
        isRequired: true,
      },
    }),
    {
      title: 'Badge',
      name: 'infoBadge',
      type: 'string',
      description:
        'Select a badge to display under the icon. Leave unset (Clear field button) for no badge.',
      options: {
        list: [
          { title: 'New', value: 'new' },
          { title: 'Coming soon', value: 'comingSoon' },
        ],
        layout: 'radio',
      },
    },
    slugSchemaField({
      title: 'Info block card path',
      description:
        'The path for the card that will act as anchor link. Do not add "#" symbol. (e.g. "bitcoin")',
      isRequired: false,
    }),
    {
      name: 'infoBlockButtons',
      title: 'Buttons',
      type: 'array',
      description: `Button with a label and a link that can redirect to an internal page or section, or to an external website such as "https://google.com"`,
      validation: undefined,
      of: [
        {
          type: 'reference',
          to: [
            {
              type: 'button',
            },
          ],
        },
      ],
    },
  ],
})
