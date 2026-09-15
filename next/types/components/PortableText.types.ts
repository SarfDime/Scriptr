import type { PortableTextValue } from '@shared/types/portable-text.types'
import type { BoxProps } from '@/components/common/Box'
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

type PortableContentProps = {
  children?: PortableTextValue
  renderWrapper?: boolean
  as?: ComponentTags['box']
} & Omit<BoxProps, 'children' | 'as'> &
  ComponentParserType

export type { ComponentParserType, OverrideElement, PortableContentProps }
