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

type PalettesNB = `${ColorPaletteClass}-${ColorPaletteVariant & 'nb'}`
type PalettesINT = `${ColorPaletteClass}-${ColorPaletteVariant & 'int'}`

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
