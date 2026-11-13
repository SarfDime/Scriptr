import type { ComponentType, ReactNode } from 'react'
import type { BoxProps } from '@/components/common/Box'
import type { TextProps } from '@/components/typography/Text'
import type { TitleProps } from '@/components/typography/Title'
import type { BadgeProps } from '@/components/ui/Badge'
import type { SanityIconProps } from '@/types/component.types'
import type { ComponentColorPalettes } from './ColorPalettes.types'

export type SectionHeaderProps = {
  /** Heading text (or rich text). Nothing renders if empty. */
  title: TitleProps['children']
  /** Supporting line under the heading. */
  subtitle?: ReactNode
  /** Optional leading icon component, e.g. a `@sanity/icons` icon. */
  icon?: ComponentType<SanityIconProps>
  /** Count shown in a badge next to the title. Hidden when undefined. */
  count?: number | string
  /** Content aligned to the end of the title row (buttons, links). */
  actions?: ReactNode
  /** Heading level. Defaults to `h2`. */
  as?: TitleProps['as']
  /** `title` (default) for an ordinary section, `heading` for a section that
   * leads a page and needs to sit just under the page title. */
  titleVariant?: 'title' | 'heading' | 'subHeading'
  /** `start` (default) keeps the title row left-aligned; `center` centres the
   * title, count and subtitle, for sections whose content is centred. */
  align?: 'start' | 'center'
  titleProps?: Omit<TitleProps, 'as' | 'children'>
  subtitleProps?: Omit<TextProps, 'children'>
  iconProps?: SanityIconProps
  badgeProps?: Omit<BadgeProps, 'children'>
  colorPalette?: ComponentColorPalettes
} & Omit<BoxProps, 'children' | 'title' | 'as'>
