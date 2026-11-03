import localFont from 'next/font/local'

/**
 * Every font the app declares — Matter for body copy, Antique Olive (and its
 * condensed cut) for display type. A Bricolage Grotesque declaration used to sit
 * here too: nothing styled with it, so it cost a Google Fonts request on every
 * page for no glyph.
 *
 * Every font the app declares. This lives beside the woff2 files so the paths
 * stay local to the module, and out of the root layout, which only needs the
 * class names the faces expose.
 *
 * `preload: false` on the four local families is deliberate. `next/font`
 * preloads every declared file, so a page loaded 22 woff2 files while using
 * five faces (measured on `/university/ukim`: antiqueOlive 700/900, matter
 * 400/500/600). Without the preload links the browser fetches only the faces the
 * page actually renders, and `display: 'swap'` keeps the fallback visible in the
 * meantime. Which weights the UI still needs is a separate question — declared
 * weights are not all used, and trimming them is a UI audit (docs/PROGRESS.md).
 */
// 1. Matter - Standard geometric font with straightforward weights
export const matter = localFont({
  src: [
    { path: './Matter-Light.woff2', weight: '300', style: 'normal' },
    {
      path: './Matter-LightItalic.woff2',
      weight: '300',
      style: 'italic',
    },
    { path: './Matter-Regular.woff2', weight: '400', style: 'normal' },
    {
      path: './Matter-RegularItalic.woff2',
      weight: '400',
      style: 'italic',
    },
    { path: './Matter-Medium.woff2', weight: '500', style: 'normal' },
    {
      path: './Matter-MediumItalic.woff2',
      weight: '500',
      style: 'italic',
    },
    { path: './Matter-SemiBold.woff2', weight: '600', style: 'normal' },
    {
      path: './Matter-SemiBoldItalic.woff2',
      weight: '600',
      style: 'italic',
    },
    { path: './Matter-Bold.woff2', weight: '700', style: 'normal' },
    { path: './Matter-BoldItalic.woff2', weight: '700', style: 'italic' },
    { path: './Matter-Heavy.woff2', weight: '900', style: 'normal' },
    {
      path: './Matter-HeavyItalic.woff2',
      weight: '900',
      style: 'italic',
    },
  ],
  variable: '--font-matter',
  display: 'swap',
  preload: false,
})

// 2. Antique Olive - Main Family
export const antiqueOlive = localFont({
  src: [
    {
      path: './AntiqueOliveStd-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: './AntiqueOliveStd-Roman.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './AntiqueOliveStd-Italic.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: './AntiqueOliveStd-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    // Compact is narrower and heavier than Bold, lighter than Black
    {
      path: './AntiqueOliveStd-Compact.woff2',
      weight: '800',
      style: 'normal',
    },
    {
      path: './AntiqueOliveStd-Black.woff2',
      weight: '900',
      style: 'normal',
    },
    // Nord is the ultra-bold, wide display cut of Antique Olive
    {
      path: './AntiqueOliveStd-Nord.woff2',
      weight: '950',
      style: 'normal',
    },
    {
      path: './AntiqueOliveStd-NordItalic.woff2',
      weight: '950',
      style: 'italic',
    },
  ],
  variable: '--font-antique-olive',
  display: 'swap',
  preload: false,
})

// 3. Antique Olive Condensed (Separated so it doesn't conflict with standard Bold)
export const antiqueOliveCond = localFont({
  src: [
    {
      path: './AntiqueOliveStd-BoldCond.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-antique-olive-cond',
  display: 'swap',
  preload: false,
})
