import type { BREAKPOINTS } from '../config/next-constants'
import type { ButtonVariantType } from '../config/shared-pt-config'
import type { PortableTextValue } from './portable-text.types'
import type { SanityImageType } from './sanity-transform.types'

// TODO: add academic/page link targets once the Sanity link selector supports
// them again. Custom paths are the only destination for now.
type LinkSelectorProps = {
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

type NavItemPresentationType = {
  stringTitle: string
  stringSubtitle?: string
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
  NavItemPresentationType,
  SanityButton,
  SanityImageSrcType,
  SanityImageType,
  Summarizable,
}
