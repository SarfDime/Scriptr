import type { PortableTextEditorOptions } from './schema'

export const RESTRICTED_EDITOR_OPTIONS = {
  excludedStyles: ['h1', 'h2', 'h3', 'h4', 'h5', 'base', 'h6'],
  excludedColors: ['dark', 'white'],
  showStyles: false,
  showLists: false,
  showAlignment: false,
} as const satisfies PortableTextEditorOptions
