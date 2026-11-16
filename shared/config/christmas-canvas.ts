import type { ChristmasCanvasConfig } from '../types/christmas-canvas.types'

// Shared by the Christmas renderer (next/lib/app-background/christmas-canvas.ts)
// and its Sanity schema (sanity/schemas/misc/christmas-canvas.ts), so both agree on
// the defaults and on which colors can be edited.

/** Used for every setting that is not set in Sanity. */
export const CHRISTMAS_DEFAULTS: ChristmasCanvasConfig = {
  seed: 2024,
  enableSnow: true,
  snowDensity: 1,
  snowSpeed: 1,
  enableSanta: true,
  santaFirstDelaySeconds: 4,
  santaMinGapSeconds: 22,
  santaMaxGapSeconds: 45,
  enableSmoke: true,
  treeDecorationChance: 0.12,
  houseDecorationChance: 0.35,
}

/**
 * The parts of the scenery whose color can be picked in Sanity (a theme color each, for
 * the light and the dark theme separately). Shades, stripes and highlights are worked
 * out from the picked color. A part left empty keeps the built-in color.
 */
export const CHRISTMAS_COLOR_ROLES = [
  {
    key: 'mountainFar',
    title: 'Far mountains',
    description: 'The back range of mountains.',
  },
  {
    key: 'mountainNear',
    title: 'Near mountains',
    description: 'The front range of mountains.',
  },
  {
    key: 'mountainCap',
    title: 'Mountain snow caps',
    description: 'Snow on the mountain peaks.',
  },
  {
    key: 'hillBack',
    title: 'Back hill',
    description: 'The hill behind the village.',
  },
  {
    key: 'hillVillage',
    title: 'Village hill',
    description: 'The hill the village stands on.',
  },
  {
    key: 'hillBand',
    title: 'Front band hill',
    description: 'The wide hill in front of the village.',
  },
  {
    key: 'hillFront',
    title: 'Foreground hill',
    description: 'The hill at the very bottom of the screen.',
  },
  {
    key: 'treeFar',
    title: 'Far pines',
    description: 'The small pines in the distance.',
  },
  {
    key: 'treeMid',
    title: 'Middle pines',
    description: 'The pines around the village and on the front band hill.',
  },
  {
    key: 'treeNear',
    title: 'Foreground pines',
    description: 'The big pines at the sides of the screen.',
  },
  {
    key: 'houseWall',
    title: 'House walls',
    description:
      'Walls, roof underside and window frames are worked out from it.',
  },
  {
    key: 'houseSnow',
    title: 'Snow on roofs and around houses',
    description: 'Snow on the roofs, chimneys and the banks around the houses.',
  },
  {
    key: 'houseWindow',
    title: 'Lit windows',
    description: 'The color of the light in the windows (and its glow).',
  },
  {
    key: 'houseChimney',
    title: 'Chimneys',
    description: 'The chimney bricks.',
  },
  {
    key: 'snowfall',
    title: 'Falling snow',
    description: 'The falling snowflakes.',
  },
  {
    key: 'smoke',
    title: 'Chimney smoke',
    description: 'The smoke drifting up from the chimneys.',
  },
  {
    key: 'sleigh',
    title: 'Sleigh and Santa',
    description: "The sleigh and Santa's coat and hat.",
  },
  {
    key: 'reindeer',
    title: 'Reindeer',
    description:
      'The reindeer pulling the sleigh (Rudolph keeps his red nose).',
  },
] as const

export type ChristmasColorRole = (typeof CHRISTMAS_COLOR_ROLES)[number]['key']

/** Most Christmas light colors that can be set (they are used in turn). */
export const CHRISTMAS_MAX_LIGHT_COLORS = 8
