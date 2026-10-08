import type { BREAKPOINTS } from '@shared/config/next-constants'
import type { ButtonVariantType } from '@shared/config/shared-pt-config'
import type { PortableTextValue } from './portable-text.types'
import type { SanityImageType } from './sanity-transform.types'

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

type SanityImageSrcType = {
  src: string
  alt?: string
}

type SanityButton = {
  _id: string
  buttonLabel?: PortableTextValue
  buttonColorVariant?: ButtonVariantType
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
  title: PortableTextValue
  subtitle: PortableTextValue
  stringTitle: string
  stringSubtitle: string
  slug: SlugType
  icon: SanityImageType
}

// Generic type for any entity with at least an _id and name
type Summarizable = {
  _id: string
  name: string
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
  Summarizable,
}
