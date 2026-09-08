import type { BREAKPOINTS } from '@shared/config/next-constants'
import type { ComponentColorPalettes } from './component.types'
import type { PortableTextType } from './components/PortableText.types'

type SlugType = {
  _type: string
  current: string
}

type LinkSelectorProps = {
  pageSlug: SlugType
  sectionSlug: SlugType
  linkType: 'internal' | 'custom'
  customLink: string
}

type SanityImageType = {
  alt: string
  asset: {
    _ref: string
    _type: string
  }
  cornerRadius?: number
  rounded?: number
  crop?: {
    _type: string
    bottom: number
    left: number
    right: number
    top: number
  }
  hotspot?: {
    _type: string
    height: number
    width: number
    x: number
    y: number
  }
}

type SanityImageSrcType = {
  src: string
  alt?: string
}

type SanityButton = {
  _id: string
  buttonLabel?: PortableTextType
  buttonColorVariant?:
    | 'solid'
    | 'solid alternate'
    | 'outline'
    | 'transparent'
    | 'transparent alternate'
    | ComponentColorPalettes
} & LinkSelectorProps

type ImageObjectFitType = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'

type ImageObjectPositionType =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'center'
  | '[${number}%,${number}%]'

type ButtonType = 'button' | 'submit' | 'reset'

type BreakpointsType = (typeof BREAKPOINTS)[number]

type SharedSectionDataType = {
  title: PortableTextType
  subtitle: PortableTextType
  stringTitle: string
  stringSubtitle: string
  slug: SlugType
  icon: SanityImageType
}

export type {
  BreakpointsType,
  ButtonType,
  ImageObjectFitType,
  ImageObjectPositionType,
  LinkSelectorProps,
  SanityButton,
  SanityImageSrcType,
  SanityImageType,
  SharedSectionDataType,
}
