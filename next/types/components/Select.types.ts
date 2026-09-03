import type { BoxProps } from '../../components/common/Box'
import type { ButtonProps } from '../../components/common/Button'

type SelectOptionType<T = string> = {
  disabled?: boolean
  value: T
  label: React.ReactNode
}

type SelectOptionSelectType<T> = {
  handleSelect?: (option: SelectOptionType<T>) => void
}

type SelectOptionProps<T> = {
  option: SelectOptionType<T>
  buttonProps?: ButtonProps
} & SelectOptionSelectType<T>

type SelectOptionListProps<T> = {
  options: Array<SelectOptionType<T>>
  buttonProps?: ButtonProps
} & BoxProps &
  SelectOptionSelectType<T>

type SelectProps<T = string> = {
  options: Array<SelectOptionType<T>>
  defaultOption?: SelectOptionType<T>
  placeholder?: string
  clearable?: boolean
  selectListProps?: BoxProps & { href?: string }
  setSelectedValue?: (value: T) => void
  triggerProps?: ButtonProps
  buttonProps?: ButtonProps
  hideChevron?: boolean
} & BoxProps

export type {
  SelectOptionListProps,
  SelectOptionProps,
  SelectOptionType,
  SelectProps,
}
