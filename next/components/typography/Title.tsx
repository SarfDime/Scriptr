import type { ReactNode } from 'react'
import { isPortableText } from '@/lib/common-utils'
import type { PortableTextType } from '@/types/components/PortableText.types'
import type {
  AdditionalComponentAttributes,
  ComponentTags,
} from '../../types/component.types'
import { PortableTextContent } from './PortableTextContent'

export type TitleProps = {
  as?: ComponentTags['heading']
  children?: PortableTextType | ReactNode
} & Omit<AdditionalComponentAttributes, 'children' | 'title'>

/** Renders a title as a heading element, */
export function Title({ children, as = 'h4', ...rest }: TitleProps) {
  const HeadingTag = as

  if (!children) {
    return null
  }

  if (typeof children === 'string') {
    return <HeadingTag {...rest}>{children}</HeadingTag>
  }

  if (isPortableText(children)) {
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

  return <HeadingTag {...rest}>{children}</HeadingTag>
}
