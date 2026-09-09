import type { ComponentColorPalettes } from '@/types/component.types'

const COLORS: Array<ComponentColorPalettes> = [
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
]

const YEAR_COLORS: Record<number, ComponentColorPalettes> = {
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

const getCreditColor = (point: number) => {
  if (point >= 6) return 'cp-success'
  if (point >= 4) return 'cp-warning'
  if (point >= 2) return 'cp-danger'
  return 'cp-gray'
}

const getColorPallette = (seed: string) => {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0 // force 32-bit int
  }
  return COLORS[Math.abs(hash) % COLORS.length]
}

export { getColorPallette, getCreditColor, YEAR_COLORS }
