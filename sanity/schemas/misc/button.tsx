import { defineType } from 'sanity'
import { ButtonColorVariantInput } from '../../components/ButtonColorVariantInput'
import { ButtonIcon } from '../../components/Icons'
import type { ButtonColorVariantInputProps } from '../../types/button.types'
import type { PreviewPrepareProps } from '../../types/common.types'
import { headerSchemaFields } from '../common/headerFields'
import { linkSelector } from '../common/link-selector'
import {
  generateLinkSelectorPreview,
  LinkSelectorPreviewSelect,
} from '../util-functions/utilFunctions'

export const Button = defineType({
  name: 'button',
  title: 'Button',
  type: 'document',
  icon: ButtonIcon,
  preview: {
    select: { ...LinkSelectorPreviewSelect, title: 'stringTitle' },
    prepare(selection: PreviewPrepareProps) {
      const icon = (
        <ButtonIcon
          className={`button-variant-preview preview-icon ${selection?.variant}`}
          data-variant={selection?.variant}
        />
      )
      return generateLinkSelectorPreview({
        ...selection,
        media: icon,
      })
    },
  },
  fields: [
    ...headerSchemaFields({
      title: 'Button label',
      description: 'The text that will be displayed in a button.',
      type: 'string',
    }),
    ...linkSelector,
    {
      name: 'buttonColorVariant',
      title: 'Button type',
      type: 'string',
      components: {
        input: (props: ButtonColorVariantInputProps) => (
          <ButtonColorVariantInput {...props} />
        ),
      },

      options: {
        list: [
          {
            title: 'Unset',
            value: undefined,
          },
          { title: 'Transparent', value: 'transparent' },
          { title: 'Transparent White', value: 'transparent alternate' },
          { title: 'Solid', value: 'solid' },
          { title: 'Solid Inverted', value: 'solid inverted' },
          { title: 'Subtle', value: 'subtle' },
          { title: 'Gold', value: 'golden' },
          { title: 'Success', value: 'success' },
          { title: 'Error', value: 'error' },
        ],
        layout: 'radio',
      },
      initialValue: undefined,
    },
  ],
})
