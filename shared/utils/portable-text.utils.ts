import type { PortableTextValue } from '@shared/types/portable-text.types'

type PortableTextBlock = Extract<
  NonNullable<PortableTextValue>[number],
  { children?: unknown }
>

export type RichTextSpan = Extract<
  NonNullable<PortableTextBlock['children']>[number],
  { _type: 'span' }
>

type PortableTextInput =
  | PortableTextValue
  | NonNullable<PortableTextValue>[number]

export const isPortableTextSpan = (value: unknown): value is RichTextSpan =>
  typeof value === 'object' &&
  value !== null &&
  '_type' in value &&
  value._type === 'span' &&
  'text' in value &&
  typeof value.text === 'string'

export const isPortableTextValue = (
  value: unknown
): value is PortableTextValue => {
  if (!Array.isArray(value)) return false

  return value.every(
    (block: unknown) =>
      typeof block === 'object' &&
      block !== null &&
      '_type' in block &&
      (block as Record<string, unknown>)._type === 'block' &&
      'children' in block &&
      Array.isArray(block.children) &&
      block.children.every(
        (child: unknown) => typeof child === 'object' && child !== null
      )
  )
}

/**
 * Comments allow inline Portable Text decorators but not presentation-level
 * formatting such as headings, lists, or custom text alignment.
 */
export const isCommentPortableTextValue = (
  value: unknown
): value is PortableTextValue =>
  isPortableTextValue(value) &&
  value.every((block) => {
    const record = block as Record<string, unknown>
    return (
      (record.style === undefined || record.style === 'normal') &&
      !('listItem' in record) &&
      !('level' in record) &&
      !('textAlign' in record)
    )
  })

export const portableTextToPlainText = (blocks?: PortableTextInput): string => {
  // Guard against null or undefined
  if (!blocks) return ''

  const blockArray = Array.isArray(blocks) ? blocks : [blocks]

  return blockArray
    .filter(
      // 3. Type predicate tells TypeScript that `block` definitely has `children` here
      (block): block is PortableTextBlock =>
        typeof block === 'object' &&
        block !== null &&
        '_type' in block &&
        block._type === 'block' &&
        'children' in block &&
        Array.isArray(block.children)
    )
    .map((block) => {
      return (block.children || [])
        .map((child: unknown) => {
          if (isPortableTextSpan(child)) {
            // TypeScript now strictly knows child is a RichTextSpan
            return child.text || ''
          }
          return ' '
        })
        .join('')
    })
    .join('\n\n')
    .trim()
}
