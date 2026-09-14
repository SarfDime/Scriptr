import type { PortableTextValue } from '@shared/types/portable-text.types'
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

/** @deprecated Use PortableTextValue directly instead */
type PortableTextType = PortableTextValue

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
