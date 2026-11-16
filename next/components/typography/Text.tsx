import type { ComponentProps } from 'react'
import type {
  AdditionalComponentAttributes,
  ComponentTags,
} from '../../types/component.types'

export type TextProps = {
  as?: ComponentTags['text']
  htmlFor?: ComponentProps<'label'>['htmlFor']
} & AdditionalComponentAttributes

export function Text({ children, as = 'p', ...rest }: TextProps) {
  const TextTag = as

  return <TextTag {...rest}>{children}</TextTag>
}
