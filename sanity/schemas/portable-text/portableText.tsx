import { ImageIcon } from '@sanity/icons/Image'
import { defineType, type PortableTextInputProps } from 'sanity'
import type { ComponentProps } from '../../types/common.types'
import { Annotations } from './annotations'
import { AllDecorators } from './decorators'
import { HrBlock } from './hr-block'
import { CustomPortableTextInput } from './plugins/portable-highlights'
import { DefaultStyles } from './style-blocks'

const InlineButton = {
  name: 'buttonReference',
  title: 'Button',
  type: 'reference',
  to: [{ type: 'button' }],
  components: {
    preview: (props: ComponentProps) => {
      return (
        <div
          className={`button-variant-preview portable-button ${props?.media?.props?.['data-variant']}`}
        >
          {props?.title ?? props?.fallbackTitle}
        </div>
      )
    },
  },
}

// All Rich Text Toolbar Blocks
const RichTextCustomBlocks = {
  annotations: Annotations,
  inline: [
    {
      type: 'image',
      icon: ImageIcon,
    },
    InlineButton,
    HrBlock,
  ],
}

export const RichTextInput = (props: unknown) => (
  <CustomPortableTextInput {...(props as PortableTextInputProps)} />
)

export const RichTextLiteInput = (props: unknown) => (
  <CustomPortableTextInput
    {...(props as PortableTextInputProps)}
    customClassName='rich-text-lite'
  />
)

/* Standard richText schema, 
  ^ all options included, 
  ? standard height */
export const RichText = defineType({
  name: 'richText',
  title: 'RichText',
  type: 'array',

  components: {
    input: RichTextInput,
  },

  of: [
    {
      type: 'block',
      styles: DefaultStyles,
      of: RichTextCustomBlocks.inline,
      marks: {
        decorators: AllDecorators,
        annotations: RichTextCustomBlocks.annotations,
      },
    },
  ],
})

/* Lite richText schema, 
  ^ all options included,
  & half height */
export const RichTextLite = defineType({
  name: 'richTextLite',
  title: 'RichTextLite',
  type: 'array',

  components: {
    input: RichTextLiteInput,
  },

  of: [
    {
      type: 'block',
      lists: [],
      styles: DefaultStyles,
      of: RichTextCustomBlocks.inline,
      marks: {
        decorators: AllDecorators,
        annotations: RichTextCustomBlocks.annotations,
      },
    },
  ],
})
