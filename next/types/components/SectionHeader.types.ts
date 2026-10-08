import type { ComponentType, ReactNode } from 'react'
import type { BoxProps } from '@/components/common/Box'
import type { TextProps } from '@/components/typography/Text'
import type { TitleProps } from '@/components/typography/Title'
import type { BadgeProps } from '@/components/ui/Badge'
import type { SanityIconProps } from '@/types/component.types'

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
  titleProps?: Omit<TitleProps, 'as' | 'children'>
  subtitleProps?: Omit<TextProps, 'children'>
  iconProps?: SanityIconProps
  badgeProps?: Omit<BadgeProps, 'children'>
} & Omit<BoxProps, 'children' | 'title' | 'as'>
