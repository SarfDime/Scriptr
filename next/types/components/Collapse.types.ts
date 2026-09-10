import type { BoxProps } from '../../components/common/Box'
import type { ButtonProps } from '../../components/common/Button'
import type { TitleProps } from '../../components/typography/Title'
import type { SanityIconProps } from '../component.types'
import type { PortableTextType } from './PortableText.types'

type CommonCollapseProps = {
  title?: PortableTextType
  showArrow?: boolean
  triggerArrowProps?: SanityIconProps
  triggerTitleProps?: TitleProps
}

type CollapseTriggerProps = {
  isOpen?: boolean
  currentIsOpen?: boolean
  toggleCollapse?: () => void
} & CommonCollapseProps &
  Omit<ButtonProps, 'title'>

type CollapseContentProps = {
  currentIsOpen?: boolean
  contentInnerProps?: BoxProps
} & BoxProps

type CollapseProps = {
  children: React.ReactNode
  customTrigger?: {
    trigger?: React.ReactNode
    toggle?: () => void
    isOpen: boolean
  }
  rootProps?: BoxProps
  contentProps?: CollapseContentProps
  triggerProps?: CollapseTriggerProps
} & CommonCollapseProps

export type { CollapseContentProps, CollapseProps, CollapseTriggerProps }
