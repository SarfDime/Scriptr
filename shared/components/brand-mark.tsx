import type { SVGProps } from 'react'
import { BRAND_MARK, type BrandMarkWeight } from '../config/brand'

export type BrandMarkProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  weight?: BrandMarkWeight
}

/** The Scriptr monogram: two interlocked hexagons whose halves form an S.
 * `currentColor`, so it follows the theme like the type beside it; sized in `em`
 * by the caller, since it stands in for a capital in the wordmark.
 *
 * `globals.css` gives every `svg` a fixed font-size for its `1em` icons, so the
 * mark takes the surrounding type's size instead and `em` means the type's. */
export const BrandMark = ({
  weight = 'bold',
  style,
  ...props
}: BrandMarkProps) => {
  const { width, height, d } = BRAND_MARK[weight]

  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox={`0 0 ${width} ${height}`}
      fill='currentColor'
      role='presentation'
      focusable='false'
      style={{ fontSize: 'inherit', ...style }}
      {...props}
    >
      <path d={d} />
    </svg>
  )
}
