import { DocumentTextIcon } from '@sanity/icons/DocumentText'
import { defineType } from 'sanity'
import { headerSchemaFields } from '../../common/headerFields'
import { slugSchemaField } from '../../common/slug'
import { createSectionPreview } from '../../util-functions/utilFunctions'

export const InfoBlockSection = defineType({
  // Schema for "Info Block" section
  name: 'infoBlockSection',
  title: 'Info block section',
  icon: DocumentTextIcon,
  type: 'document',
  preview: createSectionPreview(),
  fields: [
    ...headerSchemaFields({
      title: 'Info block section title',
    }),
    slugSchemaField({
      title: 'Info block section path',
      description:
        'The path for the info block section that will act as anchor link. Do not add "#" symbol. (e.g. "info-block")',
    }),
    {
      title: 'Info block section list',
      name: 'infoBlockSectionList',
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
      description: 'List of elements for the info block section.',
    },
  ],
})
