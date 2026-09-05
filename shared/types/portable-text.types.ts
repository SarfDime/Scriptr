import type { Json } from './database.types'

export type PortableTextSpan = {
  _key?: string
  _type: 'span'
  marks?: Array<string>
  text: string
}

export type PortableTextMarkDefinition = {
  [key: string]: Json | undefined
}

export type PortableTextBlock = {
  _key?: string
  _type: 'block'
  children: Array<PortableTextSpan>
  markDefs?: Array<PortableTextMarkDefinition>
  style?: string
  listItem?: string
  level?: number
}

export type PortableTextValue = Array<PortableTextBlock>
