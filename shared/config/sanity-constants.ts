export const API_VERSION = '2026-08-08'
export const SANITY_PROJECT_ID = 'REDACTED_SANITY_PROJECT_ID'
export const SANITY_DATASET = 'production'
export const COLOR_CODES = {
  warning: 'var(--warn-orange)',
  error: 'var(--error-red)',
  info: 'var(--info-blue)',
  success: 'var(--jade-green)',
} as const
export const COLOR_OPTIONS = [
  {
    title: 'Cerulean 🔵',
    value: '#2975bf',
  },
  { title: 'Red 🔴', value: 'red' },
  { title: 'Gold 🟡', value: 'gold' },
  { title: 'Green 🟢', value: 'green' },
  {
    title: 'Dark Grey ⚫',
    value: 'darkGrey',
  },
] as const
export const TEXT_ALIGN = ['left', 'center', 'right'] as const
export const FONT_WEIGHT = ['200', '300', '400', '600', '700', '900'] as const

export type ColorCodeType = keyof typeof COLOR_CODES

export const GROUPING_KEYS = [
  'academic',
  'information',
  'contactInfo',
  'administration',
  'database',
  'media',
] as const
