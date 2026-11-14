import { portableTextToPlainText } from '@shared/utils/portable-text.utils'
import { defineType } from 'sanity'
import { headerSchemaFields } from '../common/headerFields'
import { localizedField } from '../common/localeFields'

/** Sanity-only content: no `dbId`, no Create/Sync actions, no internal API
 * call. The site shows one published tip per day in the navbar. */
export const StudyTip = defineType({
  name: 'studyTip',
  title: 'Study tip',
  type: 'document',
  preview: {
    select: {
      title: 'localizedTitle.en',
      titleMk: 'localizedTitle.mk',
      content: 'localizedContent.en',
      contentMk: 'localizedContent.mk',
    },
    prepare: ({ title, titleMk, content, contentMk }) => ({
      title:
        portableTextToPlainText(title) ||
        portableTextToPlainText(titleMk) ||
        'Untitled study tip',
      subtitle:
        portableTextToPlainText(content) || portableTextToPlainText(contentMk),
    }),
  },
  fields: [
    ...headerSchemaFields({
      title: 'Tip title',
      type: 'richTextLite',
      isRequired: true,
      description: 'The heading of the study tip, shown in the navigation.',
    }),
    localizedField({
      name: 'localizedContent',
      title: 'Tip content',
      description:
        'The tip itself, shown under the title. One published tip is shown per day.',
      valueType: 'richTextLite',
      isRequired: true,
    }),
  ],
})
