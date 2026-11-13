import type { PortableTextValue } from '@shared/types/portable-text.types'
import type { BoxProps } from '@/components/common/Box'
import type { ButtonBaseProps } from '@/components/common/Button'
import type { TitleProps } from '@/components/typography/Title'
import type { SanityIconProps } from '../component.types'

type CommonCollapseProps = {
  title?: PortableTextValue
  showArrow?: boolean
  triggerArrowProps?: SanityIconProps
  triggerTitleProps?: TitleProps
}

type CollapseTriggerProps = {
  isOpen?: boolean
  currentIsOpen?: boolean
  toggleCollapse?: () => void
  contentId?: string
} & CommonCollapseProps &
  Omit<ButtonBaseProps, 'title'>

type CollapseContentProps = {
  currentIsOpen?: boolean
  contentInnerProps?: BoxProps
} & BoxProps

type CollapseProps = {
  children: React.ReactNode
  /** Controls rendered beside the trigger, inside the same row, for actions
   * that must not toggle the section. */
  triggerActions?: React.ReactNode
  rootProps?: BoxProps
  contentProps?: CollapseContentProps
  triggerProps?: CollapseTriggerProps
} & CommonCollapseProps

export type { CollapseContentProps, CollapseProps, CollapseTriggerProps }
