import type { ComponentProps } from 'react'
import type {
  AdditionalComponentAttributes,
  ComponentTags,
} from '../../types/component.types'

export type TextProps = {
  as?: ComponentTags['text']
  htmlFor?: ComponentProps<'label'>['htmlFor']
} & AdditionalComponentAttributes

/** A component for rendering text elements with customizable styling and semantic meaning.
 *
 * The component renders a text element with the given `children` content.
 * The `as` prop can be used to customize the rendered
 * HTML element, and the `...rest` prop can be used to pass additional props to the
 * rendered element.
 */
export function Text({ children, as = 'p', ...rest }: TextProps) {
  const TextTag = as

  return <TextTag {...rest}>{children}</TextTag>
}
