export type PortableTextSpan = {
  _type: 'span'
  _key: string
  text?: string
  marks?: Array<string>
}

export type PortableTextChild =
  | PortableTextSpan
  | {
      _type: string
      _key: string
      [key: string]: unknown
    }

export type PortableTextBlock = {
  _type: 'block'
  _key: string
  children?: Array<PortableTextChild>
  style?: string
  listItem?: string
  markDefs?: Array<Record<string, unknown>>
  level?: number
  textAlign?: string
}

export type PortableTextValue = Array<PortableTextBlock>
