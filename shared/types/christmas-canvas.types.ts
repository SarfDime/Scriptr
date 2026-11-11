// Types for the procedurally drawn Christmas canvas background
// (next/components/ui/app-background/ChristmasCanvas.tsx,
// next/lib/app-background/christmas-canvas.ts).
// Every color is an "r, g, b" string (like StarCanvas), so it can be mixed and
// given an alpha when it is used.

import type { ChristmasColorRole } from '../config/christmas-canvas'
import type { Point } from './star-canvas.types'

/** Tunables for the scene. Defaults live in CHRISTMAS_DEFAULTS (next/lib/app-background/christmas-canvas.ts). */
export type ChristmasCanvasConfig = {
  /** Changes the layout of the hills, trees, houses and mountains (same seed, same scene). */
  seed: number
  enableSnow: boolean
  /** 1 = default amount of snowfall. */
  snowDensity: number
  /** 1 = default fall speed. */
  snowSpeed: number
  enableSanta: boolean
  santaFirstDelaySeconds: number
  santaMinGapSeconds: number
  santaMaxGapSeconds: number
  enableSmoke: boolean
  enableWindowGlow: boolean
  /** Chance (0-1) that a mid or near pine wears lights and baubles. */
  treeDecorationChance: number
  /** Chance (0-1) that a house has lights along its roof and a wreath. */
  houseDecorationChance: number
}

export type TreeStripes = { base: string; stripe: string }
export type HillColors = { fill: string; swoosh: string }

// TODO(sanity): every color below should become editable from Sanity (separately
// for the light and the dark theme) when the Sanity side of this canvas is built.
export type ChristmasColors = {
  /** Dark theme draws the moonlit night version, light theme the daytime one. */
  isDark: boolean
  mountains: { far: string; near: string; farCap: string; nearCap: string }
  /** Back to front. */
  hills: {
    back: HillColors
    village: HillColors
    band: HillColors
    front: HillColors
  }
  trees: { far: TreeStripes; mid: TreeStripes; near: TreeStripes }
  house: {
    wall: string
    wallShade: string
    roof: string
    snow: string
    snowShade: string
    window: string
    frame: string
    door: string
    chimney: string
  }
  santa: {
    body: string
    trim: string
    sack: string
    coat: string
    fur: string
    skin: string
    deer: string
    nose: string
  }
  /** Colors of the Christmas lights and baubles, used in turn. */
  lights: Array<string>
  snowfall: string
  smoke: string
  sparkle: string
  /** A wash over the finished scene so page content stays readable. */
  veil: { color: string; alpha: number }
}

/** A group of pine trees scattered between two x positions. */
export type ChristmasGrove = {
  from: number
  to: number
  count: number
  minHeight: number
  maxHeight: number
  /** Where the foot of a tree at `x` with this height sits. */
  baseY: (x: number, height: number) => number
  trees: TreeStripes
  /** Paints a small snow bank of this color around each tree's foot. */
  mound?: string
  /** Chance (0-1) that a tree in this group is decorated. */
  decorated?: number
}

/** A chimney's smoke spot, found while painting the village. */
export type ChristmasChimneySpot = Point & { scale: number; phase: number }

/** Smoke is drawn on top of the picture too, so it needs `cover` like a glow group. */
export type ChristmasChimney = ChristmasChimneySpot & {
  bounds: ChristmasBounds
  cover: Array<Path2D>
}

/** A theme color name for each part of the scenery (empty = the built-in color). */
export type ChristmasColorOverrides = {
  [K in ChristmasColorRole]?: string | null
} & {
  /** Christmas light colors, used in turn (empty = the built-in colors). */
  lights?: Array<string> | null
}

/** The color picks for each theme. */
export type ChristmasColorSettings = {
  light?: ChristmasColorOverrides | null
  dark?: ChristmasColorOverrides | null
}

/** What the `christmasCanvas` document in Sanity holds (null for fields that are not set). */
export type ChristmasCanvasSanityData = {
  [K in keyof ChristmasCanvasConfig]?: ChristmasCanvasConfig[K] | null
} & {
  lightColors?: ChristmasColorOverrides | null
  darkColors?: ChristmasColorOverrides | null
}

export type ChristmasBounds = { x: number; y: number; w: number; h: number }

/** A shape that hides the glow of everything painted before it (`order` is its paint order). */
export type ChristmasOccluder = {
  order: number
  bounds: ChristmasBounds
  path: Path2D
}

/**
 * The glowing parts of one house or decorated tree: its lit windows and Christmas light
 * bulbs (`r` is the size of the glow, `colorIndex` points into colors.lights). Glows
 * are drawn on top of the whole picture, so `cover` holds the shapes painted in front
 * of this group, which have to be cut out of its glow.
 */
export type ChristmasGlowGroup = {
  windows: Array<Point & { r: number; phase: number; rate: number }>
  lights: Array<
    Point & { r: number; colorIndex: number; phase: number; rate: number }
  >
  bounds: ChristmasBounds
  cover: Array<Path2D>
}

/**
 * The random numbers a house uses, rolled up front (in the same order as before) so
 * the house can be painted later, in depth order, without changing how it looks.
 */
export type ChristmasHouseRolls = {
  side: number
  chimneyPhase: number
  windows: Array<{ phase: number; rate: number }>
  litDoor: number
}

/** Paints one Christmas light bulb (and registers its glow). */
export type ChristmasLightPainter = (
  x: number,
  y: number,
  r: number,
  index: number
) => void

/** What the scenery pieces use to take part in the glow and cover bookkeeping. */
export type ChristmasPaintEnv = {
  /** Starts a new painted object (a hill, a tree, a house): later ones cover earlier ones. */
  begin: () => void
  /** Random roll (0-1) for decoration choices, private to the current object. */
  roll: () => number
  /** The glow group of the current object (created on first use). */
  glow: () => ChristmasGlowGroup
  /** Registers a shape of the current object that hides the glow of earlier objects. */
  occlude: (path: Path2D, bounds: ChristmasBounds) => void
  light: ChristmasLightPainter
  /** Registers the smoke spot of a chimney of the current object. */
  chimney: (spot: ChristmasChimneySpot) => void
}

/**
 * Painted once with the scene; the animated layer reads these positions. The sky
 * (sun or moon, stars, clouds) is painted separately by the shared skybox.
 */
export type ChristmasScene = {
  groups: Array<ChristmasGlowGroup>
  chimneys: Array<ChristmasChimney>
}

export type SnowFlake = Point & {
  speed: number
  sway: number
  phase: number
  /** Current rotation and spin per frame, in radians. */
  angle: number
  spin: number
}

/** One pass of Santa's sleigh across the sky. */
export type SantaFlight = {
  active: boolean
  /** 1 flies left to right, -1 right to left. */
  dir: 1 | -1
  /** 0 -> 1 along the path. */
  t: number
  durationMs: number
  y0: number
  y1: number
  arch: number
  /** Phase of the sleigh's own bobbing and tilting. */
  bob: number
}

/** Each reindeer gallops and bobs on its own rhythm. */
export type ReindeerMotion = {
  /** Gallop phase offset and speed (radians, radians per ms). */
  phase: number
  gallopRate: number
  bobPhase: number
  bobRate: number
  bobAmp: number
}
