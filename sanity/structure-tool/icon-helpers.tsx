import type { ComponentType, CSSProperties } from 'react'

export const structureToolIconColors = {
  hero: 'var(--info-blue)',
  contact: 'var(--jade-green)',
  info: 'var(--rose-pink)',
  media: 'var(--cyan-blue)',
  team: 'var(--lavender-purple)',
  social: 'var(--rose-pink)',
  utility: 'var(--warn-orange)',
  faq: 'var(--info-blue-light)',
  pages: 'var(--cerulean-blue)',
  website: 'var(--jade-green)',
  ai: 'var(--magenta-pink)',
  content: 'var(--info-blue-light)',
  navigation: 'var(--lavender-purple)',
  people: 'var(--success-green)',
  interactive: 'var(--cyan-blue)',
  webschemas: 'var(--rose-pink)',
  sections: 'var(--jade-green)',
  footer: 'var(--light-cerulean-blue)',
  misc: 'var(--info-blue)',
  contentPosts: 'var(--light-cerulean-blue)',
  navigationMenu: 'var(--lavender-purple)',
  deprecated: 'var(--error-red)',
} as const

export type StructureToolIconColorsType = keyof typeof structureToolIconColors

export const createColoredIcon = (
  // biome-ignore lint/style/useNamingConvention: <exception>
  _icon: ComponentType<{ style?: CSSProperties; className?: string }>,
  category: StructureToolIconColorsType
) => {
  const color = structureToolIconColors[category] ?? 'var(--text-dark)'
  return () => <_icon style={{ color }} />
}
