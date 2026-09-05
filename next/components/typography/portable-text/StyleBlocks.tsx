import type {
  FontSizeLabelsType,
  FontSizeType,
} from '@shared/config/shared-pt-config'
import type { PortableTextBlock, PortableTextComponentProps } from 'next-sanity'

const FONT_SIZE_CLASS_MAP: Array<{
  name: FontSizeType
  class: FontSizeLabelsType
}> = [
  { name: 'h1', class: '3XL' },
  { name: 'h2', class: '2XL' },
  { name: 'h3', class: 'XL' },
  { name: 'h4', class: 'LG' },
  { name: 'h5', class: 'MD' },
  { name: 'base', class: 'BASE' },
  { name: 'h6', class: 'SM' },
]

const FontSizeBlocks = Object.fromEntries([
  ...FONT_SIZE_CLASS_MAP.map((style) => [
    style.name,
    ({ children }: PortableTextComponentProps<PortableTextBlock>) => (
      <span className={`font-size-${style.class.toLowerCase()}`}>
        {children}
      </span>
    ),
  ]),
])

export { FontSizeBlocks }
