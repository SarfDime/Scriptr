/**
 * Brand constants shared by the app, the Studio and the generated assets.
 *
 * The mark is two congruent strokes, one the other turned half a circle, whose
 * hexagon halves and stems read as an S. `bold` carries the wordmark and every
 * small raster, where the gap between the strokes has to survive; `regular` is
 * for the mark on its own at display size. The path data is the one in
 * `shared/brand/*.svg`, which a test keeps in step.
 */
export type BrandMarkShape = {
  width: number
  height: number
  d: string
}

export const BRAND_MARK = {
  regular: {
    width: 376,
    height: 718,
    d: 'M168 156L168 301L336 427L336 557L188 668L40 557L40 427L87.33 391.5L54 366.5L0 407L0 577L188 718L376 577L376 407L208 281L208 156ZM208 562L208 417L40 291L40 161L188 50L336 161L336 291L288.67 326.5L322 351.5L376 311L376 141L188 0L0 141L0 311L168 437L168 562Z',
  },
  bold: {
    width: 400,
    height: 748,
    d: 'M168 171L168 322L336 448L336 566L200 668L64 566L64 448L91 427.75L37.67 387.75L0 416L0 598L200 748L400 598L400 416L232 290L232 171ZM232 577L232 426L64 300L64 182L200 80L336 182L336 300L309 320.25L362.33 360.25L400 332L400 150L200 0L0 150L0 332L168 458L168 577Z',
  },
} as const satisfies Record<string, BrandMarkShape>

export type BrandMarkWeight = keyof typeof BRAND_MARK

/**
 * Literal colours for the places that cannot read a CSS variable: the
 * `theme-color` meta, the web manifest and rasters. A test keeps them equal to
 * `--color-brand` and `--color-background` in `next/styles/base`.
 */
export const BRAND_COLORS = {
  light: { brand: '#0099ff', background: '#faf9f6' },
  dark: { brand: '#00e699', background: '#050505' },
} as const

/**
 * The default social card, for a page with no image of its own. A public asset
 * rather than an `opengraph-image` file: `PageSEO` writes `openGraph.images`
 * on every page, and the file-convention image only fills in where that key is
 * absent.
 */
export const BRAND_OG_IMAGE = {
  url: '/brand/og-default.png',
  width: 1200,
  height: 630,
} as const
