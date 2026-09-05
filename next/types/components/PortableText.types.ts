import type { PortableTextBlock } from 'next-sanity'

import type { BoxProps } from '../../components/common/Box'
import type { ComponentTags } from '../component.types'

type OverrideElement = {
  overrideElements?: Record<
    string,
    {
      tag?: ComponentTags['box' | 'text']
      className?: string
    }
  >
}

type ComponentParserType = {
  renderDefaultBlock?: boolean
} & OverrideElement

type PortableTextType = Array<PortableTextBlock>

type PortableContentProps = {
  children?: PortableTextType
  renderWrapper?: boolean
  as?: ComponentTags['box']
} & Omit<BoxProps, 'children' | 'as'> &
  ComponentParserType

export type {
  ComponentParserType,
  OverrideElement,
  PortableContentProps,
  PortableTextType,
}
