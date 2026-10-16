import { PORTABLE_TEXT_LIMITS } from '../config/portable-text-limits'
import {
  ALIGNMENTS,
  COLORS,
  DEFAULT_DECORATOR_NAMES,
  FONT_SIZE_STYLES,
  FONT_WEIGHTS,
  LIST_ITEMS,
} from '../config/shared-pt-config'
import type { PortableTextValue } from '../types/portable-text.types'

type PortableTextBlock = Extract<
  NonNullable<PortableTextValue>[number],
  { children?: unknown }
> & {
  textAlign?: string
}

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
  isPortableTextValue(value) && value.every(isCommentBlock)

export const isValidCommentPortableTextValue = (
  value: unknown
): value is PortableTextValue =>
  isCommentPortableTextValue(value) &&
  portableTextJsonByteLength(value) <= PORTABLE_TEXT_LIMITS.commentMaximumBytes

const PORTABLE_TEXT_DECORATORS = new Set<string>([
  ...DEFAULT_DECORATOR_NAMES,
  ...COLORS,
  ...FONT_WEIGHTS,
  'highlight-newline',
])
const PORTABLE_TEXT_STYLES = new Set<string>(
  FONT_SIZE_STYLES.filter((style) => style.name !== '-').map(
    (style) => style.name
  )
)
const PORTABLE_TEXT_LISTS = new Set<string>(LIST_ITEMS.map((item) => item.name))
const PORTABLE_TEXT_ALIGNMENTS = new Set<string>(ALIGNMENTS)
const PORTABLE_TEXT_BLOCK_KEYS = new Set([
  '_type',
  '_key',
  'style',
  'children',
  'markDefs',
  'listItem',
  'level',
  'textAlign',
])
const PORTABLE_TEXT_SPAN_KEYS = new Set(['_type', '_key', 'text', 'marks'])

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const hasOnlyKeys = (
  value: Record<string, unknown>,
  allowedKeys: ReadonlySet<string>
): boolean => Object.keys(value).every((key) => allowedKeys.has(key))

const hasOptionalStringKey = (
  value: Record<string, unknown>,
  key: string
): boolean => !(key in value) || typeof value[key] === 'string'

const isAllowedSpan = (value: unknown): boolean => {
  if (
    !isRecord(value) ||
    value._type !== 'span' ||
    !hasOnlyKeys(value, PORTABLE_TEXT_SPAN_KEYS) ||
    !hasOptionalStringKey(value, '_key') ||
    typeof value.text !== 'string' ||
    (value.marks !== undefined &&
      (!Array.isArray(value.marks) ||
        !value.marks.every(
          (mark) =>
            typeof mark === 'string' && PORTABLE_TEXT_DECORATORS.has(mark)
        )))
  ) {
    return false
  }

  return true
}

const isPortableTextBlock = (value: unknown): value is PortableTextBlock => {
  if (
    !isRecord(value) ||
    value._type !== 'block' ||
    !hasOnlyKeys(value, PORTABLE_TEXT_BLOCK_KEYS) ||
    !hasOptionalStringKey(value, '_key') ||
    !Array.isArray(value.children) ||
    !value.children.every(isAllowedSpan) ||
    (value.markDefs !== undefined &&
      (!Array.isArray(value.markDefs) || value.markDefs.length > 0))
  ) {
    return false
  }

  return true
}

const isScriptBlock = (value: unknown): value is PortableTextBlock => {
  if (!isRecord(value) || !isPortableTextBlock(value)) return false

  return (
    (value.style === undefined || PORTABLE_TEXT_STYLES.has(value.style)) &&
    (value.listItem === undefined ||
      (typeof value.listItem === 'string' &&
        PORTABLE_TEXT_LISTS.has(value.listItem))) &&
    (value.level === undefined ||
      (typeof value.level === 'number' &&
        Number.isInteger(value.level) &&
        value.level >= 1)) &&
    (value.level === undefined || value.listItem !== undefined) &&
    (value.textAlign === undefined ||
      (typeof value.textAlign === 'string' &&
        PORTABLE_TEXT_ALIGNMENTS.has(value.textAlign)))
  )
}

const isCommentBlock = (value: unknown): value is PortableTextBlock =>
  isPortableTextBlock(value) &&
  (value.style === undefined || value.style === 'normal') &&
  !('listItem' in value) &&
  !('level' in value) &&
  !('textAlign' in value)

export const isScriptPortableTextValue = (
  value: unknown
): value is PortableTextValue =>
  isPortableTextValue(value) && value.every(isScriptBlock)

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

export const portableTextJsonByteLength = (
  value: PortableTextValue
): number => {
  const serialized = JSON.stringify(value)
  if (serialized === undefined) {
    throw new TypeError('Portable Text value could not be serialized')
  }

  return new TextEncoder().encode(serialized).byteLength
}

export const isScriptTitlePortableTextValue = (
  value: unknown
): value is PortableTextValue =>
  isScriptPortableTextValue(value) &&
  portableTextToPlainText(value).trim().length > 0 &&
  portableTextJsonByteLength(value) <= PORTABLE_TEXT_LIMITS.scriptTitleBytes

export const isScriptDescriptionPortableTextValue = (
  value: unknown
): value is PortableTextValue =>
  isScriptPortableTextValue(value) &&
  portableTextJsonByteLength(value) <=
    PORTABLE_TEXT_LIMITS.scriptDescriptionBytes
