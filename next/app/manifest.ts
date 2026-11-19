import { BRAND_COLORS } from '@shared/config/brand'
import { UI_STRINGS } from '@shared/config/strings'
import type { MetadataRoute } from 'next'

/**
 * The browser reads this with no page context, so it carries the default
 * language's copy and the light theme's colours. The icons are the same mark in
 * both themes; the installed app opens on the root, where the remembered
 * language sends the reader to their own.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Scriptr',
    short_name: 'Scriptr',
    description: UI_STRINGS.home.metaDescription,
    start_url: '/',
    display: 'standalone',
    background_color: BRAND_COLORS.light.background,
    theme_color: BRAND_COLORS.light.brand,
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
