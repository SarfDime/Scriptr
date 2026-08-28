import type { ReactNode } from 'react'
import type { PortableTextType } from '@/types/components/PortableText.types'
import type {
  AdditionalComponentAttributes,
  ComponentTags,
} from '../../types/component.types'
import { PortableTextContent } from './PortableTextContent'

export type TitleProps = {
  as?: ComponentTags['heading']
  children?: PortableTextType
  title?: ReactNode
} & Omit<AdditionalComponentAttributes, 'children' | 'title'>

/**
 * Renders a title as a heading element, supporting both static and localized content.
 */
export function Title({ children, title, as = 'h4', ...rest }: TitleProps) {
  const HeadingTag = as
  if (title) {
    return <HeadingTag {...rest}>{title}</HeadingTag>
  }
  return (
    <HeadingTag {...rest}>
      <PortableTextContent
        renderDefaultBlock={false}
        renderWrapper={false}
        portableText={children}
      />
    </HeadingTag>
  )
}
