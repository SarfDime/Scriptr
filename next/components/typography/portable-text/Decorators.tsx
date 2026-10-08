import type {
  ALIGNMENTS,
  COLORS,
  FONT_WEIGHTS,
} from '@shared/config/shared-pt-config'
import type { PortableTextMarkComponentProps } from 'next-sanity'
import type { ReactNode } from 'react'
import { NextLink } from '@/components/common/NextLink'

const FontWeightDecorators: Record<
  (typeof FONT_WEIGHTS)[number],
  (props: PortableTextMarkComponentProps) => ReactNode
> = {
  strong: ({ children }: PortableTextMarkComponentProps) => (
    <strong className='font-bold'>{children}</strong>
  ),
  semibold: ({ children }: PortableTextMarkComponentProps) => (
    <strong className='font-semibold'>{children}</strong>
  ),
  black: ({ children }: PortableTextMarkComponentProps) => (
    <strong className='font-black'>{children}</strong>
  ),
}

const ColorDecorators: Record<
  (typeof COLORS)[number],
  (props: PortableTextMarkComponentProps) => ReactNode
> = {
  brand: ({ children }: PortableTextMarkComponentProps) => (
    <span className='text-brand'>{children}</span>
  ),
  'brand-light': ({ children }: PortableTextMarkComponentProps) => (
    <span className='text-brand-500'>{children}</span>
  ),
  muted: ({ children }: PortableTextMarkComponentProps) => (
    <span className='text-grey'>{children}</span>
  ),
  white: ({ children }: PortableTextMarkComponentProps) => (
    <span className='text-background'>{children}</span>
  ),
  dark: ({ children }: PortableTextMarkComponentProps) => (
    <span className='text-fg'>{children}</span>
  ),
}

const AlignmentDecorators: Record<
  (typeof ALIGNMENTS)[number],
  (props: PortableTextMarkComponentProps) => ReactNode
> = {
  left: ({ children }: PortableTextMarkComponentProps) => (
    <span className='block text-center md:text-left'>{children}</span>
  ),
  center: ({ children }: PortableTextMarkComponentProps) => (
    <span className='block text-center'>{children}</span>
  ),
  right: ({ children }: PortableTextMarkComponentProps) => (
    <span className='block text-center md:text-right'>{children}</span>
  ),
}

const Decorators = {
  link: ({ children, value }: PortableTextMarkComponentProps) => {
    return (
      <NextLink
        externalIconProps={{ className: 'w-5 h-5' }}
        className='gap-0'
        href={value?.url}
      >
        {children}
      </NextLink>
    )
  },
  ...FontWeightDecorators,
  ...ColorDecorators,
  ...AlignmentDecorators,
}

export {
  AlignmentDecorators,
  ColorDecorators,
  Decorators,
  FontWeightDecorators,
}
