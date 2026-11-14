'use client'

import Bold from '@sanity/icons/Bold'
import Checkmark from '@sanity/icons/Checkmark'
import ChevronDown from '@sanity/icons/ChevronDown'
import ColorWheel from '@sanity/icons/ColorWheel'
import Italic from '@sanity/icons/Italic'
import Olist from '@sanity/icons/Olist'
import Strikethrough from '@sanity/icons/Strikethrough'
import Text from '@sanity/icons/Text'
import Ulist from '@sanity/icons/Ulist'
import Underline from '@sanity/icons/Underline'
import {
  ALIGNMENT_DECORATORS,
  type AlignmentType,
  COLOR_DECORATORS,
  type ColorsType,
  FONT_SIZE_STYLES,
  WEIGHT_DECORATORS,
} from '@shared/config/shared-pt-config'
import type { ComponentType, SVGProps } from 'react'
import { cn } from '@/lib/common-utils'
import { useUIStrings } from '@/providers/locale/use-strings'

export type PTIconComponent = ComponentType<{ className?: string }>

type AlignTextProps = SVGProps<SVGSVGElement> & { alignment: AlignmentType }

const AlignText = ({ alignment, ...props }: AlignTextProps) => {
  const strings = useUIStrings()

  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' {...props}>
      <title>{strings.editor.alignText(alignment)}</title>
      {alignment === 'left' && (
        <path
          fill='none'
          stroke='currentColor'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='1.5'
          d='M9 4.5h10m-10 5h5m-5 5h10m-10 5h5M5 3v18'
        />
      )}
      {alignment === 'center' && (
        <path
          fill='none'
          stroke='currentColor'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='1.5'
          d='M3 3h18M8 9h8M3 15h18M8 21h8'
        />
      )}
      {alignment === 'right' && (
        <path
          fill='none'
          stroke='currentColor'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='1.5'
          d='M5 4.5h10m-5 5h5m-10 5h10m-5 5h5M19 3v18'
        />
      )}
    </svg>
  )
}

/** Filled circle tinted with the decorator's real color. */
const ColorSwatch = ({
  color,
  className,
}: {
  color: ColorsType
  className?: string
}) => {
  const strings = useUIStrings()
  const colorClass: Record<ColorsType, string> = {
    brand: 'text-brand',
    muted: 'text-grey',
    dark: 'text-fg',
    'brand-light': 'text-brand-400',
    white: 'text-background',
  }
  return (
    <svg
      viewBox='0 0 24 24'
      className={cn(className, colorClass[color], 'fill-current stroke-fg')}
    >
      <title>{strings.editor.colorSwatch(color)}</title>
      <circle cx='12' cy='12' r='9' fill='currentColor' />
    </svg>
  )
}

const MISC_ICONS: Record<string, PTIconComponent> = {
  em: Italic,
  underline: Underline,
  'strike-through': Strikethrough,
}

const COLOR_ICONS: Record<string, PTIconComponent> = Object.fromEntries(
  COLOR_DECORATORS.map((d) => [
    d.name,
    ({ className }: { className?: string }) => (
      <ColorSwatch color={d.name} className={className} />
    ),
  ])
)

/**
 * `SB`/`B`/`B+` drawn at the weight they select. The caller's icon class sizes
 * boxes for glyph icons (`h-5 w-5`); a text label in one of those clipped
 * against a second, conflicting width, so the sizing is fixed here instead of
 * combined with it. `leading-none` keeps the letters centred in the box.
 */
const WEIGHT_ICONS: Record<string, PTIconComponent> = Object.fromEntries(
  WEIGHT_DECORATORS.map((decorator) => [
    decorator.name,
    () => (
      <span
        aria-hidden
        className='flex h-5 w-5 shrink-0 items-center justify-center text-[0.7rem] leading-none'
        style={{ fontWeight: decorator.weight }}
      >
        {decorator.label}
      </span>
    ),
  ])
)

const ALIGN_ICONS: Record<string, PTIconComponent> = Object.fromEntries(
  ALIGNMENT_DECORATORS.map((d) => [
    d.name,
    ({ className }: { className?: string }) => (
      <AlignText alignment={d.name} className={className} />
    ),
  ])
)

const ALL_DECORATOR_ICONS: Record<string, PTIconComponent> = {
  ...MISC_ICONS,
  ...COLOR_ICONS,
  ...WEIGHT_ICONS,
  ...ALIGN_ICONS,
}

export const resolveDecoratorIcon = (name: string) => ALL_DECORATOR_ICONS[name]

const SIZE_ICONS: Record<string, PTIconComponent> = Object.fromEntries(
  FONT_SIZE_STYLES.filter((s) => !s.isDivider).map((s) => [
    s.name,
    ({ className }: { className?: string }) => (
      <span
        className={className}
        style={{ fontSize: s.fontSize, lineHeight: 1 }}
      >
        {s.label}
      </span>
    ),
  ])
)

export const resolveStyleIcon = (name: string) => SIZE_ICONS[name]

export const LIST_ICONS: Record<string, PTIconComponent> = {
  bullet: Ulist,
  number: Olist,
  checkmarks: Checkmark,
}

export const STYLE_ICON: PTIconComponent = Text
export const WEIGHT_ICON: PTIconComponent = Bold
export const LIST_ICON: PTIconComponent = Ulist
export const FORMAT_ICON: PTIconComponent = Italic
export const COLOR_ICON: PTIconComponent = ColorWheel
export const DROPDOWN_CARET: PTIconComponent = ChevronDown
export const ALIGN_ICON: PTIconComponent = (props) => (
  <AlignText {...props} alignment='center' />
)
