import type { BREAKPOINTS } from '@/lib/constants'

type PageDomainType = {
  pageDomain: string
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

type ImageObjectFitType = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'

type ButtonType = 'button' | 'submit' | 'reset' | undefined

type BreakpointsType = (typeof BREAKPOINTS)[number]

export type {
  BreakpointsType,
  ButtonType,
  ImageObjectFitType,
  PageDomainType,
  SanityImageSrcType,
  SanityImageType,
}
