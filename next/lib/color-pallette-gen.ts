import type { ExamSession, SubjectSemester } from '@shared/types/academic.types'
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

const getSemesterColor = (
  semester: SubjectSemester,
  variant?: ColorPaletteVariant
) => {
  const map: Record<SubjectSemester, ColorPaletteClass> = {
    1: 'cp-rose',
    2: 'cp-blue',
    3: 'cp-amber',
    4: 'cp-brand',
    5: 'cp-green',
    6: 'cp-sky',
    7: 'cp-warning',
    8: 'cp-success',
    9: 'cp-danger',
    10: 'cp-yellow',
  }
  return applyVariant(map[semester ?? ''] ?? 'cp-gray', variant)
}

const getExamSessionColor = (
  month: ExamSession,
  variant?: ColorPaletteVariant
) => {
  const map: Record<ExamSession, ColorPaletteClass> = {
    january: 'cp-amber',
    // february: 'cp-green',
    // march: 'cp-blue',
    // april: 'cp-yellow',
    // may: 'cp-rose',
    june: 'cp-sky',
    // july: 'cp-amber',
    // august: 'cp-success',
    september: 'cp-rose',
    // october: 'cp-danger',
    // november: 'cp-brand',
    // december: 'cp-gray',
  }
  return applyVariant(map[month ?? ''] ?? 'cp-gray', variant)
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
  | { type: 'semester'; value: number; variant?: ColorPaletteVariant }
  | { type: 'exam'; value: string; variant?: ColorPaletteVariant }
  | { type: 'credits'; value: number; variant?: ColorPaletteVariant }

const getColorPalette = (input: ColorPaletteInput) => {
  const { type = 'seed', value, variant } = input

  switch (type) {
    case 'year':
      return getYearColor(value as number, variant)
    case 'semester':
      return getSemesterColor(value as SubjectSemester, variant)
    case 'exam':
      return getExamSessionColor(value as ExamSession, variant)
    case 'credits':
      return getCreditColor(value as number, variant)
    default:
      return getSeedColor(value as string, variant)
  }
}

export { COLORS_INTERACTIVE, COLORS_NO_BG, COLORS_VARIANTS, getColorPalette }
