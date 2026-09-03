import { DocumentTextIcon } from '@sanity/icons/DocumentText'
import { defineType } from 'sanity'
import { headerSchemaFields } from '../../common/headerFields'
import { sectionMedia } from '../../common/sectionMedia'
import { slugSchemaField } from '../../common/slug'
import { createSectionPreview } from '../../util-functions/utilFunctions'
import { validationRules } from '../../validation'

export const InfoHubSection = defineType({
  name: 'infoHubSection',
  title: 'Info hub section',
  icon: DocumentTextIcon,
  type: 'document',
  preview: createSectionPreview({
    subtitle: 'subtitle',
    fallbackTitle: 'title',
  }),
  fields: [
    ...headerSchemaFields({
      title: 'Info hub title',
      description: 'The title representing the info hub section.',
      subtitle: {
        showSubtitle: true,
        title: 'Info hub subtitle',
        description: 'The subtitle representing the info hub section.',
      },
    }),
    slugSchemaField({
      title: 'Info hub path',
      description:
        'The path for the section that will act as anchor link. Do not add "#" symbol. (e.g. "info-hub")',
    }),
    {
      name: 'layout',
      title: 'Layout Style',
      type: 'string',
      options: {
        layout: 'radio',
        direction: 'horizontal',
        list: [
          { title: 'Horizontal Cards', value: 'horizontal' },
          { title: 'Vertical Cards', value: 'vertical' },
        ],
      },
      initialValue: 'horizontal',
      validation: validationRules.isRequired,
    },
    {
      title: 'Info hub card list',
      name: 'infoHubCardList',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [
            {
              type: 'infoBlock',
            },
          ],
        },
      ],
      description: `List of elements for the info hub. It's a reference list to Info Block document type`,
    },
    {
      name: 'infoHubAdditionalInfo',
      title: 'Additional info',
      type: 'richTextLite',
      description:
        'Additional information about the info hub section shown under the info card list.',
    },
    ...sectionMedia(),
  ],
})
