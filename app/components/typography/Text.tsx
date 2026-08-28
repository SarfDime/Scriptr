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
 * The component renders a text element with the given `children` content and
 * optional `tabIndex`. The `as` prop can be used to customize the rendered
 * HTML element, and the `...rest` prop can be used to pass additional props to the
 * rendered element.
 */
export function Text({ children, tabIndex, as = 'p', ...rest }: TextProps) {
  const TextTag = as

  return (
    <TextTag tabIndex={tabIndex} {...rest}>
      {children}
    </TextTag>
  )
}
