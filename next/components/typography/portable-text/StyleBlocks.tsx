import { FONT_SIZE_STYLE_CLASSES } from '@shared/config/shared-pt-config'
import type { PortableTextBlock, PortableTextComponentProps } from 'next-sanity'
import { getBlockTextAlignment } from '@/lib/portable-text'

const FontSizeBlocks = Object.fromEntries([
  ...Object.entries(FONT_SIZE_STYLE_CLASSES).map(([name, className]) => [
    name,
    ({ children, value }: PortableTextComponentProps<PortableTextBlock>) => (
      <span
        className={`${className} block`}
        style={{ textAlign: getBlockTextAlignment(value) }}
      >
        {children}
      </span>
    ),
  ]),
])

export { FontSizeBlocks }
