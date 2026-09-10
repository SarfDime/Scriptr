// If they all need to start with 'cp-', let's use a cleaner union and a mapped/template approach:
type ColorName =
  | 'red'
  | 'green'
  | 'blue'
  | 'gray'
  | 'yellow'
  | 'brand'
  | 'rose'
  | 'sky'
  | 'amber'
  | 'success'
  | 'warning'
  | 'danger'
  | 'unstyled'

type ColorPaletteVariant = 'nb' | 'int'
type ColorPaletteClass = `cp-${ColorName}`

// Corrected template literal unions for variants
type PalettesNB = `${ColorPaletteClass}-${ColorPaletteVariant & 'nb'}`
type PalettesINT = `${ColorPaletteClass}-${ColorPaletteVariant & 'int'}`

// Or cleaner yet, combining them directly:
type PalettesWithVariant = `${ColorPaletteClass}-${ColorPaletteVariant}`

type ComponentColorPalettes = ColorPaletteClass | PalettesWithVariant

export type {
  ColorName,
  ColorPaletteClass,
  ColorPaletteVariant,
  ComponentColorPalettes,
  PalettesINT,
  PalettesNB,
  PalettesWithVariant,
}
