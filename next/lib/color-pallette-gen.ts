import type {
  ColorPaletteClass,
  ColorPaletteVariant,
  PalettesINT,
  PalettesNB,
  PalettesWithVariant,
} from '@/types/components/ColorPalettes.types'

const COLORS = [
  'cp-red',
  'cp-green',
  'cp-blue',
  'cp-yellow',
  'cp-rose',
  'cp-sky',
  'cp-amber',
  'cp-success',
  'cp-warning',
  'cp-danger',
  'cp-brand',
  'cp-gray',
] as const

const applyVariant = <T extends ColorPaletteClass>(
  color: T,
  variant?: ColorPaletteVariant
) => (variant ? (`${color}-${variant}` as const) : color)

const COLORS_INTERACTIVE: Array<PalettesINT> = COLORS.map(
  (c) => `${c}-int` as const
)

const COLORS_NO_BG: Array<PalettesNB> = COLORS.map((c) => `${c}-nb` as const)

const COLORS_VARIANTS: Array<PalettesWithVariant> = [
  ...COLORS_INTERACTIVE,
  ...COLORS_NO_BG,
] as const

const getYearColor = (year: number, variant?: ColorPaletteVariant) => {
  const map: Record<number, ColorPaletteClass> = {
    1: 'cp-red',
    2: 'cp-green',
    3: 'cp-blue',
    4: 'cp-yellow',
    5: 'cp-rose',
    6: 'cp-sky',
    7: 'cp-amber',
    8: 'cp-success',
    9: 'cp-warning',
    10: 'cp-danger',
  }
  return applyVariant(map[year] ?? 'cp-gray', variant)
}

const getSemesterColor = (semester: string, variant?: ColorPaletteVariant) => {
  const map: Record<string, ColorPaletteClass> = {
    fall: 'cp-red',
    spring: 'cp-green',
    summer: 'cp-blue',
  }
  return applyVariant(map[semester?.toLowerCase()] ?? 'cp-gray', variant)
}

const getExamSessionColor = (month: string, variant?: ColorPaletteVariant) => {
  const map: Record<string, ColorPaletteClass> = {
    january: 'cp-red',
    february: 'cp-green',
    march: 'cp-blue',
    april: 'cp-yellow',
    may: 'cp-rose',
    june: 'cp-sky',
    july: 'cp-amber',
    august: 'cp-success',
    september: 'cp-warning',
    october: 'cp-danger',
    november: 'cp-brand',
    december: 'cp-gray',
  }
  return applyVariant(map[month?.toLowerCase()] ?? 'cp-gray', variant)
}

const getCreditColor = (point: number, variant?: ColorPaletteVariant) => {
  let base: ColorPaletteClass = 'cp-gray'
  if (point >= 6) base = 'cp-success'
  else if (point >= 4) base = 'cp-warning'
  else if (point >= 2) base = 'cp-danger'
  return applyVariant(base, variant)
}

const getSeedColor = (seed: string, variant?: ColorPaletteVariant) => {
  let hash = 0
  for (let i = 0; i < seed?.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  const base = COLORS[Math.abs(hash) % COLORS.length] ?? 'cp-gray'
  return applyVariant(base, variant)
}

type ColorPaletteInput =
  | { type?: 'seed'; value: string; variant?: ColorPaletteVariant }
  | { type: 'year'; value: number; variant?: ColorPaletteVariant }
  | { type: 'semester'; value: string; variant?: ColorPaletteVariant }
  | { type: 'exam'; value: string; variant?: ColorPaletteVariant }
  | { type: 'credit'; value: number; variant?: ColorPaletteVariant }

const getColorPalette = (input: ColorPaletteInput) => {
  const { type = 'seed', value, variant } = input

  switch (type) {
    case 'year':
      return getYearColor(value as number, variant)
    case 'semester':
      return getSemesterColor(value as string, variant)
    case 'exam':
      return getExamSessionColor(value as string, variant)
    case 'credit':
      return getCreditColor(value as number, variant)
    default:
      return getSeedColor(value as string, variant)
  }
}

export { COLORS_INTERACTIVE, COLORS_NO_BG, COLORS_VARIANTS, getColorPalette }
