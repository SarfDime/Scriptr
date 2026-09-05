import type {
  PortableTextSpan,
  PortableTextValue,
} from '../types/portable-text.types'

const isPortableTextSpan = (value: unknown): value is PortableTextSpan =>
  typeof value === 'object' &&
  value !== null &&
  '_type' in value &&
  value._type === 'span' &&
  'text' in value &&
  typeof value.text === 'string'

export const isPortableTextValue = (
  value: unknown
): value is PortableTextValue => {
  if (!Array.isArray(value) || value.length === 0) return false

  return value.every(
    (block) =>
      typeof block === 'object' &&
      block !== null &&
      '_type' in block &&
      block._type === 'block' &&
      'children' in block &&
      Array.isArray(block.children) &&
      block.children.length > 0 &&
      block.children.every(isPortableTextSpan)
  )
}

export const portableTextToPlainText = (value: PortableTextValue) =>
  value
    .map((block) => block.children.map((child) => child.text).join(''))
    .join('\n')
    .trim()
