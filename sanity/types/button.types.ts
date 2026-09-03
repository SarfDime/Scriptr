import type { ButtonVariantType } from '@shared/config/shared-pt-config'
import type { ReactNode } from 'react'

type ButtonVariantOption = {
  title: string
  value?: ButtonVariantType
  description?: string
}

type ButtonColorVariantInputProps = {
  value?: string
  onChange: (patch: unknown) => void
  schemaType?: {
    options?: {
      list?: Array<ButtonVariantOption>
    }
  }
}

type VariantListInputProps = {
  options: Array<ButtonVariantOption>
  value?: string
  onChange: (patch: unknown) => void
  renderPreview?: (
    option: ButtonVariantOption,
    isSelected: boolean
  ) => ReactNode
}

export type {
  ButtonColorVariantInputProps,
  ButtonVariantOption,
  ButtonVariantType,
  VariantListInputProps,
}
