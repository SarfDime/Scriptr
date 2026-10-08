export const FONT_SIZES = ['h1', 'h2', 'h3', 'h4', 'h5', 'base', 'h6'] as const
export const FONT_SIZE_LABELS = [
  '3XL',
  '2XL',
  'XL',
  'LG',
  'MD',
  'SM',
  'BASE',
] as const
export const COLORS = [
  'brand',
  'brand-light',
  'muted',
  'white',
  'dark',
] as const
export const FONT_WEIGHTS = ['semibold', 'strong', 'black'] as const
export const ALIGNMENTS = ['left', 'center', 'right'] as const
export const BUTTON_VARIANTS = [
  'solid',
  'hollow',
  'ghost',
  'link',
  'basic',
  'inverted',
  'subtle',
  'success',
  'warning',
  'danger',
] as const
/** 'strong' and 'code' are deliberately excluded: 'strong' is superseded by the
 *  weight decorator above, and 'code' isn't offered in this field. Confirm this
 *  matches DEFAULT_DECORATORS from 'sanity' filtered in decorators.tsx. */
export const DEFAULT_DECORATOR_NAMES = [
  'em',
  'underline',
  'strike-through',
] as const

type FontSizeType = (typeof FONT_SIZES)[number]
type FontSizeLabelsType = (typeof FONT_SIZE_LABELS)[number]
type FontWeightType = (typeof FONT_WEIGHTS)[number]
type ColorsType = (typeof COLORS)[number]
type AlignmentType = (typeof ALIGNMENTS)[number]
type ButtonVariantType = (typeof BUTTON_VARIANTS)[number]
type DefaultDecoratorsType = (typeof DEFAULT_DECORATOR_NAMES)[number]

/** Everything here should be imported by BOTH the Sanity schema (decorators.tsx,
 *  lists.tsx, style-blocks.tsx) and the frontend inline editor, so the two can
 *  never drift out of sync. Studio-only concerns (icons, field validation,
 *  Sanity `component` render props) stay in the Studio files and just reference
 *  the `name`/`value` from here. */

export const COLOR_DECORATORS: Array<{
  name: ColorsType
  label: string
  color: string
}> = [
  { name: 'brand', label: 'Brand', color: 'var(--cerulean-blue)' },
  {
    name: 'brand-light',
    label: 'Brand Light',
    color: 'var(--light-cerulean-blue)',
  },
  { name: 'muted', label: 'Muted', color: 'var(--text-muted)' },
  { name: 'white', label: 'White', color: 'var(--text-light)' },
  { name: 'dark', label: 'Black', color: 'var(--text-dark)' },
] as const

export const WEIGHT_DECORATORS: Array<{
  name: FontWeightType
  label: string
  weight: number
}> = [
  { name: 'semibold', label: 'SB', weight: 600 },
  { name: 'strong', label: 'B', weight: 700 },
  { name: 'black', label: 'B+', weight: 900 },
] as const

export const ALIGNMENT_DECORATORS: Array<{
  name: AlignmentType
  label: string
  arrow: string
}> = [
  { name: 'left', label: 'Align Left', arrow: '<-' },
  { name: 'center', label: 'Align Center', arrow: '-' },
  { name: 'right', label: 'Align Right', arrow: '->' },
] as const

export const LIST_ITEMS = [
  { name: 'bullet', label: 'Bullet' },
  { name: 'number', label: 'Numbered' },
  { name: 'checkmarks', label: 'Checkmarks' },
  { name: 'blue-bullet', label: 'Blue Bullet' },
] as const

export const FONT_SIZE_STYLES: Array<{
  name: FontSizeType | 'normal' | '-'
  label: FontSizeLabelsType | 'N/A' | '—'
  fontSize: string
  lineHeight?: string
  isDivider?: boolean
}> = [
  { name: 'normal', label: 'N/A', fontSize: '0.75rem' },
  {
    name: '-',
    label: '—',
    fontSize: '0.75rem',
    isDivider: true,
  },
  { name: 'h1', label: '3XL', fontSize: '1.3rem', lineHeight: '1.2rem' },
  { name: 'h2', label: '2XL', fontSize: '1.25rem', lineHeight: '1.15rem' },
  { name: 'h3', label: 'XL', fontSize: '1.15rem', lineHeight: '1.05rem' },
  { name: 'h4', label: 'LG', fontSize: '1rem', lineHeight: '.9rem' },
  { name: 'h5', label: 'MD', fontSize: '0.8rem', lineHeight: '.7rem' },
  { name: 'base', label: 'BASE', fontSize: '0.7rem', lineHeight: '.65rem' },
  { name: 'h6', label: 'SM', fontSize: '0.6rem', lineHeight: '.55rem' },
] as const

export const FONT_SIZE_STYLE_CLASSES: Record<FontSizeType, string> = {
  h1: 'font-size-3xl',
  h2: 'font-size-2xl',
  h3: 'font-size-xl',
  h4: 'font-size-lg',
  h5: 'font-size-md',
  base: 'font-size-sm',
  h6: 'font-size-sm',
}

export type {
  AlignmentType,
  ButtonVariantType,
  ColorsType,
  DefaultDecoratorsType,
  FontSizeLabelsType,
  FontSizeType,
  FontWeightType,
}
