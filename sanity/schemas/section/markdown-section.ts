import { defineType } from 'sanity'
import { headerSchemaFields } from '../common/headerFields'
import { slugSchemaField } from '../common/slug'
import { createSectionPreview } from '../util-functions/utilFunctions'
import { validationRules } from '../validation'

export const MarkdownSection = defineType({
  name: 'markdownSection',
  title: 'Markdown section',
  type: 'document',
  preview: createSectionPreview({
    fallbackTitle: 'markdown',
  }),
  fields: [
    {
      name: 'position',
      type: 'string',
      title: 'Text position',
      description: 'Choose a position for the text.',
      options: {
        list: [
          { title: 'Left', value: 'left' },
          { title: 'Center', value: 'center' },
          { title: 'Right', value: 'right' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'left',
      validation: validationRules.isRequired,
    },
    {
      name: 'backgroundColor',
      type: 'string',
      title: 'Background color',
      description: 'Choose a background for the section.',
      options: {
        list: [
          { title: 'White', value: 'white' },
          { title: 'Brand Light', value: `brand-light` },
          { title: 'Brand', value: 'brand' },
          { title: 'Light gray', value: 'muted' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'white',
    },
    ...headerSchemaFields({
      title: 'Title',
      description:
        'A title for the markdown section, used internally to differentiate between different documents (not visible to end users).',
    }),
    slugSchemaField({
      description:
        'The path for the featured section that will act as anchor link. Do not add "#" symbol. (e.g. "markdown-info")',
    }),
  ],
})
