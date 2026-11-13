import { portableTextToPlainText } from '@shared/utils/portable-text.utils'
import { defineField, defineType } from 'sanity'
import { headerSchemaFields } from '../common/headerFields'
import { validationRules } from '../validation'

/** Sanity-only content: no `dbId`, no Create/Sync actions, no internal API
 * call. The site shows one published tip per day in the navbar. */
export const StudyTip = defineType({
  name: 'studyTip',
  title: 'Study tip',
  type: 'document',
  preview: {
    select: {
      title: 'title',
      content: 'content',
    },
    prepare: ({ title, content }) => ({
      title: portableTextToPlainText(title) || 'Untitled study tip',
      subtitle: portableTextToPlainText(content),
    }),
  },
  fields: [
    ...headerSchemaFields({
      title: 'Tip title',
      type: 'richTextLite',
      isRequired: true,
      description: 'The heading of the study tip, shown in the navigation.',
    }),
    defineField({
      name: 'content',
      title: 'Tip content',
      type: 'richTextLite',
      description:
        'The tip itself, shown under the title. One published tip is shown per day.',
      validation: (rule) => validationRules.descriptionValidation(rule, true),
    }),
  ],
})
