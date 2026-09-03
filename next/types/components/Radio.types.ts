import type { ReactNode } from 'react'
import type { BoxProps } from '@/components/common/Box'
import type { ButtonProps } from '@/components/common/Button'
import type { TextProps } from '@/components/typography/Text'
import type { IconProps } from '../component.types'

type OptionType = {
  value: string
  label: string
  description?: ReactNode
  checked?: boolean
}

type RadioGroupProps = {
  disabled?: boolean
  value?: Array<OptionType> | string
  onChange?: (value?: string) => void
  options: ReadonlyArray<OptionType>
  hasBorder?: boolean
} & Omit<BoxProps, 'onChange'>

type RadioProps = {
  label: ReactNode
  description?: ReactNode
  onChange?: (value?: string) => void
  value?: string
  checked?: boolean
  labelProps?: TextProps
  checkMarkProps?: IconProps
  hasBorder?: boolean
} & Omit<ButtonProps, 'onChange'>

export type { OptionType, RadioGroupProps, RadioProps }
