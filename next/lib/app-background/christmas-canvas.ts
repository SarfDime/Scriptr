'use client'

import {
  CHRISTMAS_DEFAULTS,
  type ChristmasColorRole,
} from '@shared/config/christmas-canvas'
import type {
  ChristmasBounds,
  ChristmasCanvasConfig,
  ChristmasCanvasSanityData,
  ChristmasChimneySpot,
  ChristmasColorOverrides,
  ChristmasColorSettings,
  ChristmasColors,
  ChristmasGlowGroup,
  ChristmasGrove,
  ChristmasHouseRolls,
  ChristmasOccluder,
  ChristmasPaintEnv,
  ChristmasScene,
  HillColors,
  TreeStripes,
} from '@shared/types/christmas-canvas.types'
import {
  addFalloff,
  createColorResolver,
  mixRGB,
  TAU,
  WHITE,
} from '@/lib/star-canvas'

// Procedural Christmas scenery, drawn in a flat, layered vector style: snow-capped
// mountains, wavy hills with crescent "swoosh" highlights, stripe-banded conical
// pines and a snowy village. The shared skybox draws behind this transparent canvas.
//
// The scenery is static: painted once into a canvas (and again on resize or theme
// change). The animated extras (snow, smoke, glow, lights, Santa) live in
// components/ui/app-background/ChristmasCanvas.tsx and only use the positions this
// returns. The reindeer are the exception: they are drawn live (paintReindeer) so
// each one can move on its own.
//
// Glows (lit windows, Christmas lights) are drawn live on top of the whole picture, so
// while painting, every hill, tree and house also records its outline (`occlude`).
// Each glowing house or tree then knows which later-painted shapes are in front of it
// and the animated layer cuts those out of its glow.

const BLACK = '0, 0, 0'

// Sleigh team layout, in its own drawing units (it faces right): the sleigh with Santa
// on the left, then the reindeer in a line, the lead one (with the red nose) last.
export const SLEIGH_SIZE = { width: 320, height: 80 } as const
/** Width of the part of the team that is the sleigh sprite (sleigh and Santa). */
export const SLEIGH_PART_WIDTH = 112
/** Where Santa's hand holds the reins, before the sleigh bobs. */
export const SLEIGH_HAND = { x: 82, y: 36 } as const
export const REINDEER_COUNT = 4
export const reindeerX = (i: number) => 150 + 45 * i
export const reindeerY = (i: number) => (i % 2 === 0 ? 46 : 42)

// ── Small helpers ───────────────────────────────────────────────────────────

export const rgba = (rgb: string, alpha = 1) => `rgba(${rgb}, ${alpha})`
export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Small seeded random generator, so the scene looks the same on every repaint. */
const mulberry32 = (seed: number) => {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const luminance = (rgb: string) => {
  const [r = 0, g = 0, b = 0] = rgb.split(',').map(Number)
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

/** A shade (`k` toward black) or a tint (`t` toward white) of an "r, g, b" string. */
const shadeOf = (rgb: string, k: number) => mixRGB(rgb, BLACK, k)
const tintOf = (rgb: string, t: number) => mixRGB(rgb, WHITE, t)

const intersects = (a: ChristmasBounds, b: ChristmasBounds) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y

const circle = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number
) => {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, TAU)
  ctx.fill()
}

/** Soft round sprite (glow, smoke puff): `rgb` fading to nothing at the edge. */
export const buildRadialSprite = (
  size: number,
  rgb: string,
  peak: number,
  power: number
) => {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const sctx = canvas.getContext('2d')
  if (sctx) {
    const half = size / 2
    const gradient = sctx.createRadialGradient(half, half, 0, half, half, half)
    addFalloff(gradient, rgb, peak, power)
    sctx.fillStyle = gradient
    sctx.fillRect(0, 0, size, size)
  }
  return canvas
}

// ── Colors ──────────────────────────────────────────────────────────────────

/**
 * Reads the theme colors (the same way StarCanvas does) and builds the scenery palette.
 * The scenery follows the theme: blues and navy pines in the light theme, moonlit
 * night tones with the brand green on the pines in the dark theme. Call again after a
 * theme change. The colors picked in Sanity are applied on top (see
 * resolveChristmasColors).
 */
const defaultColors = (): ChristmasColors => {
  const c = createColorResolver()
  const background = c('background')
  const isDark = luminance(background) < 0.4
  const amber = c('amber')
  const gold = c('golden-yellow')
  const red = c('error-red')
  const jade = c('jade')
  const brand = (step: number) => c(`brand-${step}`)
  const lights = [red, gold, mixRGB(jade, WHITE, 0.15), c('sky')]

  if (!isDark) {
    const white = c('background-50')
    const ink = c('fg-700')
    const wall = mixRGB(amber, ink, 0.55)
    return {
      isDark,
      mountains: {
        far: mixRGB(c('grey-450'), brand(300), 0.4),
        near: mixRGB(c('grey-550'), brand(600), 0.3),
        farCap: mixRGB(white, brand(150), 0.3),
        nearCap: white,
      },
      hills: {
        back: { fill: brand(150), swoosh: brand(200) },
        village: { fill: white, swoosh: brand(100) },
        band: { fill: brand(350), swoosh: brand(250) },
        front: { fill: white, swoosh: c('grey-250') },
      },
      trees: {
        far: {
          base: mixRGB(brand(450), brand(150), 0.5),
          stripe: mixRGB(brand(400), brand(150), 0.5),
        },
        mid: { base: brand(700), stripe: brand(650) },
        near: { base: brand(800), stripe: brand(750) },
      },
      house: {
        wall,
        wallShade: mixRGB(wall, BLACK, 0.22),
        roof: mixRGB(wall, BLACK, 0.4),
        snow: white,
        snowShade: brand(100),
        window: gold,
        frame: mixRGB(wall, BLACK, 0.55),
        door: mixRGB(ink, amber, 0.2),
        chimney: mixRGB(red, ink, 0.45),
      },
      santa: {
        body: mixRGB(red, BLACK, 0.1),
        trim: gold,
        sack: mixRGB(jade, BLACK, 0.15),
        coat: red,
        fur: white,
        skin: mixRGB(amber, white, 0.6),
        deer: mixRGB(amber, ink, 0.55),
        nose: red,
      },
      lights,
      snowfall: white,
      smoke: mixRGB(white, brand(200), 0.35),
      sparkle: mixRGB(gold, white, 0.35),
      veil: { color: background, alpha: 0.06 },
    }
  }

  // Dark theme: the brand scale runs dark -> light here, so brand(50..250) are deep greens
  const night = mixRGB(c('sky'), c('lavender'), 0.3)
  const dim = (rgb: string, k: number) => mixRGB(rgb, BLACK, k)
  const moonlit = (t: number, k: number) => dim(mixRGB(night, WHITE, t), k)
  const wall = dim(amber, 0.72)
  return {
    isDark,
    mountains: {
      far: dim(night, 0.66),
      near: dim(night, 0.52),
      farCap: moonlit(0.35, 0.3),
      nearCap: moonlit(0.5, 0.25),
    },
    hills: {
      back: { fill: dim(night, 0.58), swoosh: dim(night, 0.48) },
      village: { fill: moonlit(0.22, 0.42), swoosh: moonlit(0.3, 0.34) },
      band: { fill: dim(night, 0.5), swoosh: dim(night, 0.38) },
      front: { fill: moonlit(0.25, 0.38), swoosh: moonlit(0.35, 0.3) },
    },
    trees: {
      far: {
        base: mixRGB(brand(100), night, 0.5),
        stripe: mixRGB(brand(50), night, 0.5),
      },
      mid: { base: brand(150), stripe: brand(100) },
      near: { base: brand(200), stripe: brand(100) },
    },
    house: {
      wall,
      wallShade: dim(wall, 0.3),
      roof: dim(amber, 0.82),
      snow: moonlit(0.55, 0.2),
      snowShade: dim(night, 0.3),
      window: gold,
      frame: dim(amber, 0.9),
      door: dim(amber, 0.85),
      chimney: dim(red, 0.7),
    },
    santa: {
      body: red,
      trim: gold,
      sack: mixRGB(jade, BLACK, 0.15),
      coat: red,
      fur: WHITE,
      skin: mixRGB(amber, WHITE, 0.6),
      deer: dim(amber, 0.45),
      nose: red,
    },
    lights,
    snowfall: mixRGB(WHITE, c('sky'), 0.1),
    smoke: mixRGB(night, WHITE, 0.45),
    sparkle: mixRGB(gold, WHITE, 0.35),
    veil: { color: background, alpha: 0.14 },
  }
}

// ── Shapes ──────────────────────────────────────────────────────────────────

/** Puts the colors picked in Sanity on top of the built-in palette. */
const applyColorOverrides = (
  base: ChristmasColors,
  overrides: ChristmasColorOverrides,
  c: ReturnType<typeof createColorResolver>
): ChristmasColors => {
  const colors = structuredClone(base)
  const pick = (role: ChristmasColorRole) => {
    const key = overrides[role]
    return key ? c(key) : null
  }
  // Highlights go lighter on the dark theme and darker on the light one
  const highlight = base.isDark ? WHITE : BLACK
  const stripe = base.isDark ? BLACK : WHITE

  const mountainFar = pick('mountainFar')
  if (mountainFar) colors.mountains.far = mountainFar
  const mountainNear = pick('mountainNear')
  if (mountainNear) colors.mountains.near = mountainNear
  const cap = pick('mountainCap')
  if (cap) {
    colors.mountains.nearCap = cap
    colors.mountains.farCap = mixRGB(cap, colors.mountains.far, 0.15)
  }

  for (const [role, hill] of [
    ['hillBack', colors.hills.back],
    ['hillVillage', colors.hills.village],
    ['hillBand', colors.hills.band],
    ['hillFront', colors.hills.front],
  ] as const) {
    const fill = pick(role)
    if (!fill) continue
    hill.fill = fill
    hill.swoosh = mixRGB(fill, highlight, 0.1)
  }

  for (const [role, trees] of [
    ['treeFar', colors.trees.far],
    ['treeMid', colors.trees.mid],
    ['treeNear', colors.trees.near],
  ] as const) {
    const treeBase = pick(role)
    if (!treeBase) continue
    trees.base = treeBase
    trees.stripe = mixRGB(treeBase, stripe, 0.15)
  }

  const wall = pick('houseWall')
  if (wall) {
    colors.house.wall = wall
    colors.house.wallShade = mixRGB(wall, BLACK, 0.22)
    colors.house.roof = mixRGB(wall, BLACK, 0.4)
    colors.house.frame = mixRGB(wall, BLACK, 0.55)
  }
  const snow = pick('houseSnow')
  if (snow) {
    colors.house.snow = snow
    colors.house.snowShade = mixRGB(snow, BLACK, 0.12)
  }
  const windowLight = pick('houseWindow')
  if (windowLight) colors.house.window = windowLight
  const chimney = pick('houseChimney')
  if (chimney) colors.house.chimney = chimney

  const snowfall = pick('snowfall')
  if (snowfall) colors.snowfall = snowfall
  const smoke = pick('smoke')
  if (smoke) colors.smoke = smoke
  const sleigh = pick('sleigh')
  if (sleigh) {
    colors.santa.body = sleigh
    colors.santa.coat = sleigh
  }
  const reindeer = pick('reindeer')
  if (reindeer) colors.santa.deer = reindeer

  if (overrides.lights?.length) colors.lights = overrides.lights.map(c)
  return colors
}

/**
 * The scenery palette: the built-in colors of the current theme, with the colors picked
 * in Sanity for that theme (if any) applied on top. Call again after a theme change.
 */
export const resolveChristmasColors = (
  settings?: ChristmasColorSettings | null
): ChristmasColors => {
  const colors = defaultColors()
  const overrides = colors.isDark ? settings?.dark : settings?.light
  if (!overrides) return colors
  return applyColorOverrides(colors, overrides, createColorResolver())
}

/**
 * The immersive palette: the scenery's own colors, with neither the theme nor the
 * colors picked in Sanity applied — the counterpart of the sky's `sky-original-*`
 * palette (sky-colors.module.css). Full-screen hides the page, so nothing has to stay
 * readable and the scene is free to be the saturated version of itself: clean snow,
 * deep green pines, a warm wooden village and a red-and-gold sleigh. The tokens live
 * in christmas-colors.module.css and do not change with the theme, so the picture is
 * the same in the light and the dark theme.
 *
 * `isDark` is true so the lights and windows glow at their nighttime strength and the
 * mountains keep their full shading; this palette is about color, not about daylight.
 */
export const resolveImmersiveChristmasColors = (): ChristmasColors => {
  const c = createColorResolver()
  const snow = c('christmas-original-snow')
  const snowShade = c('christmas-original-snow-shade')
  const pine = c('christmas-original-pine')
  const pineLight = c('christmas-original-pine-light')
  const pineDark = c('christmas-original-pine-dark')
  const rockFar = c('christmas-original-rock-far')
  const rockNear = c('christmas-original-rock-near')
  const back = c('christmas-original-hill-back')
  const village = c('christmas-original-hill-village')
  const band = c('christmas-original-hill-band')
  const front = c('christmas-original-hill-front')
  const red = c('christmas-original-red')
  const gold = c('christmas-original-gold')
  const jade = c('christmas-original-jade')
  const wall = c('christmas-original-wall')
  const roof = c('christmas-original-roof')
  const windowLight = c('christmas-original-window')
  const chimney = c('christmas-original-chimney')

  return {
    isDark: true,
    mountains: {
      far: rockFar,
      near: rockNear,
      farCap: mixRGB(snow, rockFar, 0.25),
      nearCap: snow,
    },
    hills: {
      back: { fill: back, swoosh: mixRGB(back, snow, 0.22) },
      village: { fill: village, swoosh: mixRGB(village, BLACK, 0.08) },
      band: { fill: band, swoosh: mixRGB(band, snow, 0.2) },
      front: { fill: front, swoosh: mixRGB(front, BLACK, 0.06) },
    },
    trees: {
      far: {
        base: mixRGB(pine, rockFar, 0.4),
        stripe: mixRGB(pineLight, rockFar, 0.35),
      },
      mid: { base: pine, stripe: pineLight },
      near: { base: pineDark, stripe: pine },
    },
    house: {
      wall,
      wallShade: mixRGB(wall, BLACK, 0.32),
      roof,
      snow,
      snowShade,
      window: windowLight,
      frame: mixRGB(wall, BLACK, 0.62),
      door: mixRGB(roof, BLACK, 0.15),
      chimney,
    },
    santa: {
      body: mixRGB(red, BLACK, 0.1),
      trim: gold,
      sack: jade,
      coat: red,
      fur: snow,
      skin: c('christmas-original-skin'),
      deer: c('christmas-original-deer'),
      nose: red,
    },
    lights: [red, gold, jade, c('christmas-original-ice')],
    snowfall: snow,
    smoke: c('christmas-original-smoke'),
    sparkle: mixRGB(gold, snow, 0.35),
    // Nothing is read through the scenery in immersive mode, so nothing is veiled.
    veil: { color: snow, alpha: 0 },
  }
}

/** Sanity returns `null` for unset fields, so `{...CHRISTMAS_DEFAULTS, ...data}` is not enough. */
export const withChristmasDefaults = (
  data?: ChristmasCanvasSanityData | null
): ChristmasCanvasConfig => {
  const config: ChristmasCanvasConfig = { ...CHRISTMAS_DEFAULTS }
  for (const [key, value] of Object.entries(data ?? {})) {
    if (value != null && key in config) {
      ;(config as Record<string, unknown>)[key] = value
    }
  }
  return config
}

type HeightAt = (x: number) => number

const makeWave = (
  w: number,
  h: number,
  base: number,
  amp: number,
  rng: () => number
): HeightAt => {
  const f1 = 0.8 + rng() * 0.8
  const f2 = 1.7 + rng() * 1.2
  const p1 = rng() * TAU
  const p2 = rng() * TAU
  return (x) =>
    h * base +
    h *
      amp *
      (Math.sin((x / w) * TAU * f1 + p1) * 0.65 +
        Math.sin((x / w) * TAU * f2 + p2) * 0.35)
}

const paintHill = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  crest: HeightAt,
  fill: string,
  env: ChristmasPaintEnv
) => {
  env.begin()
  const step = Math.max(8, w / 120)
  const path = new Path2D()
  let top = h
  path.moveTo(-step, h + 2)
  for (let x = -step; x <= w + step; x += step) {
    const y = crest(x)
    top = Math.min(top, y)
    path.lineTo(x, y)
  }
  path.lineTo(w + step, h + 2)
  path.closePath()
  ctx.fillStyle = rgba(fill)
  ctx.fill(path)
  env.occlude(path, { x: 0, y: top, w, h: h - top + 2 })
}

/** A crescent band that follows a curve: flat on top, bulging down, tapering at both ends. */
const paintSwoosh = (
  ctx: CanvasRenderingContext2D,
  curve: HeightAt,
  x0: number,
  x1: number,
  offset: number,
  thickness: number,
  rgb: string,
  alpha: number
) => {
  const steps = 28
  ctx.beginPath()
  for (let i = 0; i <= steps; i++) {
    const x = lerp(x0, x1, i / steps)
    if (i === 0) ctx.moveTo(x, curve(x) + offset)
    else ctx.lineTo(x, curve(x) + offset)
  }
  for (let i = steps; i >= 0; i--) {
    const t = i / steps
    const x = lerp(x0, x1, t)
    ctx.lineTo(x, curve(x) + offset + thickness * Math.sin(Math.PI * t))
  }
  ctx.closePath()
  ctx.fillStyle = rgba(rgb, alpha)
  ctx.fill()
}

const paintHillSwooshes = (
  ctx: CanvasRenderingContext2D,
  w: number,
  vh: number,
  crest: HeightAt,
  hill: HillColors,
  rng: () => number
) => {
  const a0 = rng() * w * 0.3
  paintSwoosh(
    ctx,
    crest,
    a0,
    a0 + w * (0.35 + rng() * 0.25),
    vh * 0.018,
    vh * 0.035,
    hill.swoosh,
    1
  )
  const b0 = w * 0.45 + rng() * w * 0.2
  paintSwoosh(
    ctx,
    crest,
    b0,
    b0 + w * (0.3 + rng() * 0.2),
    vh * 0.06,
    vh * 0.025,
    hill.swoosh,
    0.8
  )
}

/**
 * A lumpy snow bank along a baseline, `halfWidth` to each side of `x`. `taper` (0-1)
 * makes the lumps shrink toward both ends, so the bank melts into the ground.
 */
const paintDrift = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  halfWidth: number,
  rise: number,
  drop: number,
  lumps: number,
  taper: number,
  rgb: string
) => {
  ctx.fillStyle = rgba(rgb)
  ctx.beginPath()
  ctx.moveTo(x - halfWidth, y)
  for (let i = 1; i <= lumps; i++) {
    const fromX = x - halfWidth + (2 * halfWidth * (i - 1)) / lumps
    const toX = x - halfWidth + (2 * halfWidth * i) / lumps
    const envelope = 1 - taper * (1 - Math.sin((Math.PI * (i - 0.5)) / lumps))
    ctx.quadraticCurveTo(
      (fromX + toX) / 2,
      y - rise * (i % 2 === 0 ? 1.6 : 2.4) * envelope,
      toX,
      y
    )
  }
  ctx.quadraticCurveTo(x, y + drop * 2, x - halfWidth, y)
  ctx.closePath()
  ctx.fill()
}

const paintRange = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  vh: number,
  baseY: number,
  heights: readonly [number, number],
  body: string,
  cap: string,
  shadeAlpha: number,
  rng: () => number
) => {
  const spacing = vh * 0.46
  const points: Array<{ x: number; y: number; peak: boolean }> = []
  let x = -spacing * 0.3
  while (x < w + spacing) {
    const peakHeight = vh * lerp(heights[0], heights[1], rng())
    points.push({ x, y: baseY - peakHeight, peak: true })
    x += spacing * (0.45 + rng() * 0.35)
    points.push({
      x,
      y: baseY - peakHeight * (0.12 + rng() * 0.25),
      peak: false,
    })
    x += spacing * (0.45 + rng() * 0.35)
  }

  const bottom = baseY + h * 0.1
  ctx.beginPath()
  ctx.moveTo(points[0]?.x ?? 0, bottom)
  for (const point of points) ctx.lineTo(point.x, point.y)
  ctx.lineTo(points[points.length - 1]?.x ?? w, bottom)
  ctx.closePath()
  ctx.fillStyle = rgba(body)
  ctx.fill()

  // Three flat tones per peak: a lit face on the side the light comes from, a shaded
  // face on the other, and a darker foot where the range meets the hills. Together
  // with the snow caps that is enough depth for the flat style, with no gradient.
  const lit = mixRGB(body, WHITE, 0.22)
  const shadow = mixRGB(body, BLACK, 0.45)
  const deep = mixRGB(body, BLACK, 0.66)
  const faceAlpha = clamp(shadeAlpha * 2.4, 0.16, 0.6)
  const footAlpha = clamp(shadeAlpha * 1.6, 0.1, 0.4)

  ctx.save()
  // Everything below is inside the range's silhouette, so a face can never spill out.
  ctx.clip()

  ctx.fillStyle = rgba(deep, footAlpha)
  ctx.fillRect(0, baseY - vh * 0.02, w, bottom - baseY + vh * 0.02)

  for (let i = 1; i < points.length - 1; i++) {
    const peak = points[i]
    const left = points[i - 1]
    const right = points[i + 1]
    if (!peak || !left || !right || !peak.peak) continue

    // Lit face, on the left of the ridge
    ctx.beginPath()
    ctx.moveTo(peak.x, peak.y)
    ctx.lineTo(left.x, left.y)
    ctx.lineTo(lerp(peak.x, left.x, 0.2), baseY + vh * 0.04)
    ctx.closePath()
    ctx.fillStyle = rgba(lit, faceAlpha * 0.9)
    ctx.fill()

    // Shaded face, on the right
    ctx.beginPath()
    ctx.moveTo(peak.x, peak.y)
    ctx.lineTo(right.x, right.y)
    ctx.lineTo(lerp(peak.x, right.x, 0.25), baseY + vh * 0.04)
    ctx.closePath()
    ctx.fillStyle = rgba(shadow, faceAlpha)
    ctx.fill()

    // A darker fold where the two faces meet
    ctx.strokeStyle = rgba(deep, 0.35)
    ctx.lineWidth = Math.max(1, vh * 0.003)
    ctx.beginPath()
    ctx.moveTo(peak.x, peak.y)
    ctx.lineTo(lerp(peak.x, right.x, 0.12), baseY + vh * 0.04)
    ctx.stroke()

    // Two flat rock facets down the shaded face. The jitter comes from the peak index
    // rather than `rng`, so the shared scene layout is exactly what it was before.
    for (let k = 0; k < 2; k++) {
      const jitter = (((i * 13 + k * 7) % 9) / 9) * 0.08
      const t = 0.26 + k * 0.28 + jitter
      const edgeX = lerp(peak.x, right.x, t)
      const edgeY = lerp(peak.y, right.y, t)
      const facetWidth = (right.x - peak.x) * (0.08 + (k === 0 ? 0.04 : 0.02))
      ctx.beginPath()
      ctx.moveTo(edgeX, edgeY)
      ctx.lineTo(edgeX + facetWidth, lerp(edgeY, right.y, 0.5))
      ctx.lineTo(edgeX + facetWidth * 0.35, lerp(edgeY, baseY + vh * 0.04, 0.3))
      ctx.closePath()
      ctx.fillStyle = rgba(deep, 0.16)
      ctx.fill()
    }
  }
  ctx.restore()

  for (let i = 1; i < points.length - 1; i++) {
    const peak = points[i]
    const left = points[i - 1]
    const right = points[i + 1]
    if (!peak || !left || !right || !peak.peak) continue

    // Snow cap with a zigzag lower edge
    const depth = 0.3 + rng() * 0.12
    const lx = lerp(peak.x, left.x, depth)
    const ly = lerp(peak.y, left.y, depth)
    const rx = lerp(peak.x, right.x, depth)
    const ry = lerp(peak.y, right.y, depth)
    const mid = (ly + ry) / 2
    const zig = (baseY - peak.y) * 0.06
    const traceCap = () => {
      ctx.beginPath()
      ctx.moveTo(peak.x, peak.y)
      ctx.lineTo(lx, ly)
      ctx.lineTo(lerp(lx, rx, 0.22), mid + zig)
      ctx.lineTo(lerp(lx, rx, 0.45), mid - zig * 0.3)
      ctx.lineTo(lerp(lx, rx, 0.7), mid + zig * 1.1)
      ctx.lineTo(rx, ry)
      ctx.closePath()
    }

    // The cap's own shadow on the rock, then the cap itself, so it sits on the peak
    // instead of being painted into it.
    ctx.save()
    ctx.translate(0, zig * 0.6)
    traceCap()
    ctx.fillStyle = rgba(shadow, 0.5)
    ctx.fill()
    ctx.restore()

    traceCap()
    ctx.fillStyle = rgba(cap)
    ctx.fill()
  }
}

/** A conical pine with a rounded tip and alternating color bands. */
const paintPine = (
  ctx: CanvasRenderingContext2D,
  env: ChristmasPaintEnv,
  x: number,
  baseY: number,
  height: number,
  widthRatio: number,
  trees: TreeStripes,
  stripes: number
) => {
  const width = height * widthRatio
  const tipWidth = width * 0.08
  const tipRound = height * 0.07
  const topY = baseY - height
  const outline = new Path2D()
  outline.moveTo(x - width / 2, baseY)
  outline.lineTo(x - tipWidth, topY + tipRound)
  outline.quadraticCurveTo(
    x,
    topY - tipRound * 0.35,
    x + tipWidth,
    topY + tipRound
  )
  outline.lineTo(x + width / 2, baseY)
  outline.closePath()
  ctx.fillStyle = rgba(trees.base)
  ctx.fill(outline)
  env.occlude(outline, {
    x: x - width / 2,
    y: topY - tipRound,
    w: width,
    h: height + tipRound,
  })

  ctx.fillStyle = rgba(trees.stripe)
  for (let i = 1; i < stripes; i += 2) {
    const y1 = topY + (i / stripes) * height
    const y2 = topY + ((i + 1) / stripes) * height
    const w1 = (width * (y1 - topY)) / height
    const w2 = (width * (y2 - topY)) / height
    ctx.beginPath()
    ctx.moveTo(x - w1 / 2, y1)
    ctx.lineTo(x + w1 / 2, y1)
    ctx.lineTo(x + w2 / 2, y2)
    ctx.lineTo(x - w2 / 2, y2)
    ctx.closePath()
    ctx.fill()
  }
}

const paintStar = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  outer: number,
  rgb: string
) => {
  ctx.fillStyle = rgba(rgb)
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outer : outer * 0.45
    const angle = -Math.PI / 2 + (i * Math.PI) / 5
    const px = x + Math.cos(angle) * radius
    const py = y + Math.sin(angle) * radius
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
}

/** Garlands of lights across the tree, a few baubles, and sometimes a star on top. */
const decorateTree = (
  ctx: CanvasRenderingContext2D,
  env: ChristmasPaintEnv,
  colors: ChristmasColors,
  x: number,
  baseY: number,
  height: number,
  widthRatio: number
) => {
  const width = height * widthRatio
  const topY = baseY - height
  const bulb = Math.max(1.4, height * 0.011)
  const rows = height > 120 ? 4 : 3
  let index = Math.floor(env.roll() * colors.lights.length)

  ctx.strokeStyle = rgba(colors.house.frame, 0.7)
  ctx.lineWidth = Math.max(1, bulb * 0.5)
  for (let j = 0; j < rows; j++) {
    const y = topY + height * (0.3 + (j * 0.55) / rows)
    const half = ((width * (y - topY)) / height / 2) * 0.88
    const sag = half * 0.3
    ctx.beginPath()
    ctx.moveTo(x - half, y)
    ctx.quadraticCurveTo(x, y + sag * 2, x + half, y)
    ctx.stroke()
    const bulbs = Math.max(3, Math.round((half * 2) / (bulb * 4.5)))
    for (let k = 0; k <= bulbs; k++) {
      const t = k / bulbs
      const px =
        (1 - t) * (1 - t) * (x - half) +
        2 * (1 - t) * t * x +
        t * t * (x + half)
      const py =
        (1 - t) * (1 - t) * y + 2 * (1 - t) * t * (y + sag * 2) + t * t * y
      env.light(px, py, bulb, index++)
    }
  }

  for (let k = 0; k < 3; k++) {
    const by = topY + height * (0.35 + env.roll() * 0.55)
    const half = ((width * (by - topY)) / height / 2) * 0.7
    const bx = x + (env.roll() * 2 - 1) * half
    const r = bulb * 1.7
    ctx.fillStyle = rgba(colors.lights[index++ % colors.lights.length] ?? WHITE)
    circle(ctx, bx, by, r)
    ctx.fillStyle = rgba(WHITE, 0.6)
    circle(ctx, bx - r * 0.3, by - r * 0.3, r * 0.3)
  }

  if (env.roll() < 0.5) {
    const outer = Math.max(3, height * 0.035)
    paintStar(ctx, x, topY + outer * 0.4, outer, colors.santa.trim)
    env.light(x, topY + outer * 0.4, outer * 0.35, 1)
  }
}

/** Places the trees of a group (random numbers only, nothing is painted yet). */
const makeGroveTrees = (rng: () => number, grove: ChristmasGrove) =>
  Array.from({ length: grove.count }, () => {
    const x = lerp(grove.from, grove.to, rng())
    const height = lerp(grove.minHeight, grove.maxHeight, rng())
    return {
      x,
      height,
      baseY: grove.baseY(x, height),
      ratio: 0.34 + rng() * 0.12,
      stripes: 4 + Math.floor(rng() * 3),
    }
  })
type GroveTree = ReturnType<typeof makeGroveTrees>[number]

const paintGroveTree = (
  ctx: CanvasRenderingContext2D,
  env: ChristmasPaintEnv,
  colors: ChristmasColors,
  grove: ChristmasGrove,
  tree: GroveTree
) => {
  env.begin()
  paintPine(
    ctx,
    env,
    tree.x,
    tree.baseY,
    tree.height,
    tree.ratio,
    grove.trees,
    tree.stripes
  )
  if (grove.mound) {
    paintDrift(
      ctx,
      tree.x,
      tree.baseY,
      tree.height * tree.ratio * 0.6,
      tree.height * 0.02,
      tree.height * 0.015,
      4,
      0.6,
      grove.mound
    )
  }
  if (grove.decorated && env.roll() < grove.decorated) {
    decorateTree(ctx, env, colors, tree.x, tree.baseY, tree.height, tree.ratio)
  }
}

const paintGrove = (
  ctx: CanvasRenderingContext2D,
  rng: () => number,
  env: ChristmasPaintEnv,
  colors: ChristmasColors,
  grove: ChristmasGrove
) => {
  const trees = makeGroveTrees(rng, grove)
  // Lower trees are nearer, so they are painted last
  trees.sort((a, b) => a.baseY - b.baseY)
  for (const tree of trees) paintGroveTree(ctx, env, colors, grove, tree)
}

/** The random numbers one house uses (rolled up front, so painting order can change). */
const rollHouse = (rng: () => number): ChristmasHouseRolls => {
  const side = rng()
  const chimneyPhase = rng()
  const first = { phase: rng(), rate: rng() }
  const second = { phase: rng(), rate: rng() }
  const litDoor = rng()
  return { side, chimneyPhase, windows: [first, second], litDoor }
}

/**
 * The shapes a house can take. They differ in proportion and in where the windows and
 * the door sit, so the village does not read as one template repeated. The roof, the
 * snow, the chimney and the decorations are shared by all of them.
 */
type HouseVariant = {
  /** Wall height and roof height, as a share of the house's width. */
  wallRatio: number
  roofRatio: number
  /** Windows (never more than two): `dx` as a share of the width, `dy` of the wall. */
  windows: ReadonlyArray<{ dx: number; dy: number; scale: number }>
  /** Door: its centre and width as shares of the width, its height of the wall. */
  door: { dx: number; width: number; height: number }
  /**
   * Where the lit front ends and the shaded side wall begins, as a share of the width
   * from the centre. The roof's shading is split here too, so the two lines meet.
   */
  foldRatio: number
  /** A small snow-covered canopy over the door. */
  canopy?: boolean
  /** Mirrors the whole house, so its door and its shaded side swap places. */
  mirror?: boolean
}

// The classic gable house, the one every other shape is measured against: two windows
// in one row on the lit front, and the door on the shaded side wall, clear of both the
// corner and the fold. The roof's shading splits at the fold, so the two line up.
const GABLE_HOUSE: HouseVariant = {
  wallRatio: 0.46,
  roofRatio: 0.4,
  windows: [
    { dx: -0.27, dy: 0.22, scale: 0.9 },
    { dx: 0.02, dy: 0.22, scale: 0.9 },
  ],
  door: { dx: 0.35, width: 0.12, height: 0.62 },
  foldRatio: 0.2,
}

const HOUSE_VARIANTS: ReadonlyArray<HouseVariant> = [
  GABLE_HOUSE,
  {
    // A low, wide cabin with one window, facing the other way: its door is on the left
    // and its shaded side on the left too.
    wallRatio: 0.34,
    roofRatio: 0.24,
    windows: [{ dx: -0.18, dy: 0.3, scale: 1 }],
    door: { dx: 0.16, width: 0.12, height: 0.78 },
    foldRatio: 0.31,
    mirror: true,
  },
  {
    // A chalet with a steep roof and a snow-covered canopy over its door
    wallRatio: 0.5,
    roofRatio: 0.5,
    windows: [
      { dx: -0.27, dy: 0.24, scale: 0.88 },
      { dx: 0.02, dy: 0.24, scale: 0.88 },
    ],
    door: { dx: 0.35, width: 0.12, height: 0.6 },
    foldRatio: 0.2,
    canopy: true,
  },
]

/** The shape a house takes; a roll already spent, so the scene sequence is unchanged. */
const pickHouseVariant = (roll: number): HouseVariant =>
  HOUSE_VARIANTS[
    Math.min(
      HOUSE_VARIANTS.length - 1,
      Math.floor(roll * HOUSE_VARIANTS.length)
    )
  ] ?? GABLE_HOUSE

const paintHouse = (
  ctx: CanvasRenderingContext2D,
  rolls: ChristmasHouseRolls,
  env: ChristmasPaintEnv,
  colors: ChristmasColors,
  x: number,
  groundY: number,
  width: number,
  decorationChance: number
) => {
  env.begin()
  const decorated = env.roll() < decorationChance
  const c = colors.house
  const variant = pickHouseVariant(rolls.side)
  // A mirrored house puts its door and its shaded side on the other side, so the
  // village is not a row of houses all facing the same way. The light still comes from
  // the top left, so a door's inner shadow and the chimney stay as they are.
  const flip = variant.mirror ? -1 : 1
  const half = width / 2
  const wallHeight = width * variant.wallRatio
  const roofHeight = width * variant.roofRatio
  const overhang = width * 0.07
  const eaveY = groundY - wallHeight
  const peakY = eaveY - roofHeight
  const shadeFrom = x + flip * width * variant.foldRatio
  const shadedEdge = x + flip * half
  const shadeX = Math.min(shadeFrom, shadedEdge)
  const shadeWidth = Math.abs(shadedEdge - shadeFrom)
  const board = Math.max(1, width * 0.018)
  const wallEdge = Math.max(1, width * 0.005)

  // Snow bank behind the house, sticking out on both sides of it
  paintDrift(
    ctx,
    x,
    groundY,
    half * 1.35,
    width * 0.06,
    width * 0.02,
    7,
    0.35,
    c.snow
  )

  // Chimney first: the roof covers its foot. A darker right side and two brick
  // joints give it the volume a flat rectangle lacks.
  const side = rolls.chimneyPhase < 0.5 ? -1 : 1
  const chimneyX = x + flip * side * half * 0.5
  const slopeY =
    peakY + (Math.abs(chimneyX - x) / (half + overhang)) * (eaveY - peakY)
  const chimneyWidth = width * 0.1
  const chimneyHeight = roofHeight * 0.55
  const chimneyTop = slopeY - chimneyHeight
  const chimneyShade = shadeOf(c.chimney, 0.35)
  ctx.fillStyle = rgba(c.chimney)
  ctx.fillRect(
    chimneyX - chimneyWidth / 2,
    chimneyTop,
    chimneyWidth,
    chimneyHeight + roofHeight * 0.2
  )
  ctx.fillStyle = rgba(chimneyShade)
  ctx.fillRect(
    chimneyX + chimneyWidth * 0.14,
    chimneyTop,
    chimneyWidth * 0.36,
    chimneyHeight + roofHeight * 0.2
  )
  ctx.strokeStyle = rgba(shadeOf(c.chimney, 0.5), 0.6)
  ctx.lineWidth = Math.max(1, chimneyWidth * 0.07)
  ctx.beginPath()
  for (const t of [0.3, 0.6]) {
    const y = chimneyTop + (chimneyHeight + roofHeight * 0.2) * t
    ctx.moveTo(chimneyX - chimneyWidth / 2, y)
    ctx.lineTo(chimneyX + chimneyWidth / 2, y)
  }
  ctx.stroke()
  ctx.fillStyle = rgba(c.snow)
  ctx.fillRect(
    chimneyX - chimneyWidth * 0.65,
    chimneyTop - chimneyWidth * 0.28,
    chimneyWidth * 1.3,
    chimneyWidth * 0.38
  )
  env.chimney({
    x: chimneyX,
    y: chimneyTop - chimneyWidth * 0.3,
    scale: width / 110,
    phase: rolls.chimneyPhase,
  })

  // Walls: the lit front, a shaded right side, a shadow under the eave and a stone
  // footing. Five flat tones, plus siding and corner boards, keep the wall from
  // reading as one pale slab.
  ctx.fillStyle = rgba(c.wall)
  ctx.fillRect(x - half, eaveY, width, wallHeight)
  ctx.fillStyle = rgba(c.wallShade)
  ctx.fillRect(shadeX, eaveY, shadeWidth, wallHeight)
  ctx.fillStyle = rgba(c.roof, 0.34)
  ctx.fillRect(x - half, eaveY, width, wallHeight * 0.11)

  // Siding: three faint boards across the whole wall
  ctx.strokeStyle = rgba(shadeOf(c.wall, 0.16), 0.5)
  ctx.lineWidth = wallEdge
  ctx.beginPath()
  for (const t of [0.34, 0.58, 0.82]) {
    const y = eaveY + wallHeight * t
    ctx.moveTo(x - half, y)
    ctx.lineTo(x + half, y)
  }
  ctx.stroke()

  // Corner boards, including the one where the lit front meets the shaded side
  ctx.fillStyle = rgba(c.frame, 0.4)
  ctx.fillRect(x - half, eaveY, board, wallHeight)
  ctx.fillRect(x + half - board, eaveY, board, wallHeight)
  ctx.fillRect(shadeFrom - board / 2, eaveY, board, wallHeight)

  // A stone footing, with seams between the blocks
  const footingHeight = wallHeight * 0.1
  const footing = mixRGB(c.wall, c.roof, 0.45)
  ctx.fillStyle = rgba(footing)
  ctx.fillRect(x - half, groundY - footingHeight, width, footingHeight)
  ctx.strokeStyle = rgba(shadeOf(footing, 0.4), 0.55)
  ctx.lineWidth = wallEdge
  ctx.beginPath()
  for (const t of [0.28, 0.56, 0.84]) {
    ctx.moveTo(x - half + width * t, groundY - footingHeight)
    ctx.lineTo(x - half + width * t, groundY)
  }
  ctx.stroke()

  // Windows, following the variant's layout
  for (const [i, spec] of variant.windows.entries()) {
    const roll = rolls.windows[i % rolls.windows.length]
    const windowWidth = width * 0.15 * spec.scale
    const windowHeight = windowWidth * 1.25
    const wx = x + flip * width * spec.dx - windowWidth / 2
    const windowY = eaveY + wallHeight * spec.dy
    const border = Math.max(1, windowWidth * 0.1)
    const bar = Math.max(1, windowWidth * 0.08)

    // Frame, then the glass in it
    ctx.fillStyle = rgba(c.frame)
    ctx.fillRect(
      wx - border,
      windowY - border,
      windowWidth + border * 2,
      windowHeight + border * 2
    )
    ctx.fillStyle = rgba(c.window)
    ctx.fillRect(wx, windowY, windowWidth, windowHeight)
    // A shadowed reveal at the top and a sill below, so the opening sits in the wall
    ctx.fillStyle = rgba(BLACK, 0.16)
    ctx.fillRect(wx, windowY, windowWidth, windowHeight * 0.18)
    ctx.fillStyle = rgba(c.frame, 0.9)
    ctx.fillRect(wx + windowWidth / 2 - bar / 2, windowY, bar, windowHeight)
    ctx.fillRect(wx, windowY + windowHeight / 2 - bar / 2, windowWidth, bar)
    ctx.fillStyle = rgba(c.frame)
    ctx.fillRect(
      wx - border * 1.6,
      windowY + windowHeight + border,
      windowWidth + border * 3.2,
      Math.max(1, border * 1.2)
    )
    env.glow().windows.push({
      x: wx + windowWidth / 2,
      y: windowY + windowHeight / 2,
      r: windowWidth * 2.4,
      phase: (roll?.phase ?? 0) * TAU,
      rate: 0.0008 + (roll?.rate ?? 0) * 0.0012,
    })
  }

  // Door: a frame, the recessed door, a shadow down its inner edge, two panels, a
  // handle and a stone threshold.
  const doorWidth = width * variant.door.width
  const doorHeight = wallHeight * variant.door.height
  const doorX = x + flip * width * variant.door.dx - doorWidth / 2
  const doorFrame = Math.max(1, doorWidth * 0.11)
  ctx.fillStyle = rgba(c.frame)
  ctx.fillRect(
    doorX - doorFrame,
    groundY - doorHeight - doorFrame * 1.6,
    doorWidth + doorFrame * 2,
    doorHeight + doorFrame * 1.6
  )
  ctx.fillStyle = rgba(c.door)
  ctx.fillRect(doorX, groundY - doorHeight, doorWidth, doorHeight)
  ctx.fillStyle = rgba(shadeOf(c.door, 0.4), 0.75)
  ctx.fillRect(doorX, groundY - doorHeight, doorWidth * 0.16, doorHeight)
  ctx.strokeStyle = rgba(shadeOf(c.door, 0.35), 0.55)
  ctx.lineWidth = Math.max(1, doorWidth * 0.05)
  ctx.strokeRect(
    doorX + doorWidth * 0.26,
    groundY - doorHeight * 0.82,
    doorWidth * 0.52,
    doorHeight * 0.3
  )
  ctx.strokeRect(
    doorX + doorWidth * 0.26,
    groundY - doorHeight * 0.42,
    doorWidth * 0.52,
    doorHeight * 0.3
  )
  ctx.fillStyle = rgba(colors.santa.trim)
  circle(
    ctx,
    doorX + doorWidth * 0.8,
    groundY - doorHeight * 0.5,
    Math.max(1, doorWidth * 0.07)
  )
  ctx.fillStyle = rgba(shadeOf(footing, 0.25))
  ctx.fillRect(
    doorX - doorFrame * 2,
    groundY - Math.max(1, doorWidth * 0.05),
    doorWidth + doorFrame * 4,
    Math.max(1, doorWidth * 0.05)
  )
  if (rolls.litDoor < 0.35) {
    ctx.fillStyle = rgba(c.window, 0.9)
    ctx.fillRect(
      doorX + doorWidth * 0.26,
      groundY - doorHeight * 0.82,
      doorWidth * 0.52,
      doorHeight * 0.3
    )
  }

  // A snow-covered canopy over the door, on the chalet only
  if (variant.canopy) {
    const canopyWidth = doorWidth * 1.7
    const canopyY = groundY - doorHeight - doorFrame * 1.6 - width * 0.03
    const canopyX = doorX + doorWidth / 2 - canopyWidth / 2
    ctx.fillStyle = rgba(c.roof)
    ctx.fillRect(canopyX, canopyY, canopyWidth, width * 0.022)
    ctx.fillStyle = rgba(c.snow)
    ctx.fillRect(
      canopyX - width * 0.012,
      canopyY - width * 0.026,
      canopyWidth + width * 0.024,
      width * 0.03
    )
    ctx.fillStyle = rgba(c.snowShade, 0.5)
    ctx.fillRect(
      canopyX - width * 0.012,
      canopyY - width * 0.026,
      canopyWidth + width * 0.024,
      width * 0.008
    )
  }

  // Roof: dark underside, then a snow blanket with a scalloped lower edge
  const left = x - half - overhang
  const right = x + half + overhang
  ctx.fillStyle = rgba(c.roof)
  ctx.beginPath()
  ctx.moveTo(x, peakY)
  ctx.lineTo(right, eaveY + 1)
  ctx.lineTo(left, eaveY + 1)
  ctx.closePath()
  ctx.fill()
  // The eave board, darker than the roof, catches the edge under the snow
  ctx.fillStyle = rgba(shadeOf(c.roof, 0.35))
  ctx.fillRect(left, eaveY - width * 0.012, right - left, width * 0.018)

  // The house hides the glow of whatever was painted before it
  const outline = { x: left, y: peakY, w: right - left, h: groundY - peakY }
  const wall = new Path2D()
  wall.rect(x - half, eaveY, width, wallHeight)
  env.occlude(wall, outline)
  const roof = new Path2D()
  roof.moveTo(x, peakY)
  roof.lineTo(right, eaveY + 1)
  roof.lineTo(left, eaveY + 1)
  roof.closePath()
  env.occlude(roof, outline)

  const snowRight = lerp(x, right, 0.84) + overhang * 0.3
  const snowLeft = lerp(x, left, 0.84) - overhang * 0.3
  const snowEdgeY = lerp(peakY, eaveY, 0.84) + overhang * 0.1
  const bump = width * 0.045
  const scallops = 4
  ctx.beginPath()
  ctx.moveTo(x, peakY - roofHeight * 0.04)
  ctx.lineTo(snowRight, snowEdgeY)
  for (let i = 1; i <= scallops; i++) {
    const to = lerp(snowRight, snowLeft, i / scallops)
    const from = lerp(snowRight, snowLeft, (i - 0.5) / scallops)
    ctx.quadraticCurveTo(from, snowEdgeY + bump * 2, to, snowEdgeY)
  }
  ctx.closePath()
  ctx.fillStyle = rgba(c.snow)
  ctx.fill()

  // The roof's side plane is in shade. The split runs along the roof, from the peak
  // down to the corner of the house, instead of straight up from the corner.
  ctx.save()
  ctx.clip()
  ctx.beginPath()
  ctx.moveTo(x, peakY - roofHeight * 0.04)
  ctx.lineTo(flip > 0 ? right : left, eaveY + 1)
  ctx.lineTo(shadeFrom, eaveY + 1)
  ctx.closePath()
  ctx.fillStyle = rgba(c.snowShade, 0.45)
  ctx.fill()
  ctx.restore()

  // Decorated houses: lights draped along the eave and a wreath on the door
  if (decorated) {
    const bulb = Math.max(1.4, width * 0.014)
    const bulbs = 12
    for (let k = 0; k <= bulbs; k++) {
      const t = k / bulbs
      env.light(
        lerp(left, right, t),
        eaveY +
          width * 0.035 +
          Math.abs(Math.sin(t * Math.PI * 3)) * width * 0.02,
        bulb,
        k
      )
    }
    const wreathX = doorX + doorWidth / 2
    const wreathY = groundY - doorHeight * 0.6
    ctx.strokeStyle = rgba(colors.lights[2] ?? c.snow)
    ctx.lineWidth = Math.max(1.5, width * 0.02)
    ctx.beginPath()
    ctx.arc(wreathX, wreathY, doorWidth * 0.3, 0, TAU)
    ctx.stroke()
    ctx.fillStyle = rgba(colors.lights[0] ?? c.snow)
    circle(ctx, wreathX, wreathY + doorWidth * 0.3, doorWidth * 0.11)
  }

  // Snow heaped against the walls, wrapping around the foot of the house
  paintDrift(
    ctx,
    x,
    groundY + width * 0.012,
    half * 1.12,
    width * 0.035,
    width * 0.035,
    6,
    0.8,
    c.snow
  )
}

// ── The scene ───────────────────────────────────────────────────────────────

/**
 * Paints the scenery (mountains, hills, pines, village) into `ctx`, whose transform
 * must already map 1 unit to 1 CSS px. The canvas stays transparent above the
 * mountains. Returns what the animated layer needs: the glowing houses and decorated
 * trees (with the shapes in front of each) and the chimneys.
 */
export const paintChristmasScene = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  colors: ChristmasColors,
  cfg: Pick<
    ChristmasCanvasConfig,
    'seed' | 'treeDecorationChance' | 'houseDecorationChance'
  >,
  mobile: boolean
): ChristmasScene => {
  const rng = mulberry32(cfg.seed)
  // Sizes of trees and houses follow the screen, but stay in proportion on tall phones
  const u = clamp(Math.min(w / 1300, h / 760), 0.55, 1.5)
  const vh = Math.min(h, w * 1.1)
  const scene: ChristmasScene = { groups: [], chimneys: [] }

  // Bookkeeping for the glows: every painted object gets a paint order, its glowing
  // parts form a group, and its outline hides the groups painted before it. Decoration
  // choices use a generator of their own for each object, so they never shift the layout.
  let order = 0
  let current: ChristmasGlowGroup | null = null
  let objectRng = mulberry32(cfg.seed)
  const pending: Array<{ order: number; group: ChristmasGlowGroup }> = []
  const pendingChimneys: Array<{
    order: number
    spot: ChristmasChimneySpot
  }> = []
  const occluders: Array<ChristmasOccluder> = []
  const glow = () => {
    if (!current) {
      current = {
        windows: [],
        lights: [],
        bounds: { x: 0, y: 0, w: 0, h: 0 },
        cover: [],
      }
      pending.push({ order, group: current })
    }
    return current
  }
  const env: ChristmasPaintEnv = {
    begin: () => {
      order += 1
      current = null
      objectRng = mulberry32((cfg.seed ^ 0x5bd1e995) + order * 7919)
    },
    roll: () => objectRng(),
    glow,
    chimney: (spot) => pendingChimneys.push({ order, spot }),
    occlude: (path, bounds) => occluders.push({ order, bounds, path }),
    light: (x, y, r, index) => {
      const colorIndex = index % Math.max(1, colors.lights.length)
      ctx.fillStyle = rgba(colors.lights[colorIndex] ?? WHITE)
      circle(ctx, x, y, r)
      glow().lights.push({
        x,
        y,
        r: r * 4,
        colorIndex,
        phase: objectRng() * TAU,
        rate: 0.0015 + objectRng() * 0.002,
      })
    },
  }

  ctx.clearRect(0, 0, w, h)

  // Mountains: a far and a near range, behind the first hill
  paintRange(
    ctx,
    w,
    h,
    vh,
    h * 0.66,
    [0.16, 0.3],
    colors.mountains.far,
    colors.mountains.farCap,
    colors.isDark ? 0.22 : 0.1,
    rng
  )
  paintRange(
    ctx,
    w,
    h,
    vh,
    h * 0.68,
    [0.08, 0.17],
    colors.mountains.near,
    colors.mountains.nearCap,
    colors.isDark ? 0.25 : 0.12,
    rng
  )

  const back = makeWave(w, h, 0.67, 0.022, rng)
  const village = makeWave(w, h, 0.75, 0.028, rng)
  const band = makeWave(w, h, 0.83, 0.035, rng)
  const front = makeWave(w, h, 0.92, 0.03, rng)

  // Back hill, with small far pines standing behind the village hill
  paintHill(ctx, w, h, back, colors.hills.back.fill, env)
  paintHillSwooshes(ctx, w, vh, back, colors.hills.back, rng)
  paintGrove(ctx, rng, env, colors, {
    from: -w * 0.02,
    to: w * 1.02,
    count: Math.round(clamp(w / (95 * u), 6, 22)),
    minHeight: 50 * u,
    maxHeight: 90 * u,
    baseY: (x) => village(x) + 4,
    trees: colors.trees.far,
  })

  // Houses at different distances: the far ones are small and sit behind the village
  // hill's ridge (which hides their feet), the near ones are bigger and further down
  const houses = clamp(Math.round(w / (150 * u)), 4, 11)
  const slot = w / houses
  const plan = Array.from({ length: houses }, (_, i) => ({
    x: slot * (i + 0.5) + (rng() - 0.5) * slot * 0.5,
    depth: rng(),
    width: 95 + rng() * 45,
  }))
  plan.sort((a, b) => a.depth - b.depth)
  const FAR = 0.3
  for (const house of plan.filter((p) => p.depth < FAR)) {
    const width = house.width * u * lerp(0.55, 0.7, house.depth / FAR)
    paintHouse(
      ctx,
      rollHouse(rng),
      env,
      colors,
      house.x,
      village(house.x) + width * 0.12,
      width,
      cfg.houseDecorationChance
    )
  }

  // Village hill. The pines on it and the nearer houses are painted together, from the
  // back to the front, so a tree behind a house is hidden by it and a tree in front of
  // a house hides part of it
  paintHill(ctx, w, h, village, colors.hills.village.fill, env)
  paintHillSwooshes(ctx, w, vh, village, colors.hills.village, rng)
  const villageGrove: ChristmasGrove = {
    from: 0,
    to: w,
    count: houses + 2,
    minHeight: 90 * u,
    maxHeight: 160 * u,
    baseY: (x) => village(x) + vh * 0.02,
    trees: colors.trees.mid,
    mound: colors.hills.village.fill,
    decorated: cfg.treeDecorationChance,
  }
  const villageTrees = makeGroveTrees(rng, villageGrove)
  const nearHouses = plan
    .filter((p) => p.depth >= FAR)
    .map((house) => ({ house, rolls: rollHouse(rng) }))
  const village3d = [
    ...villageTrees.map((tree) => ({
      baseY: tree.baseY,
      paint: () => paintGroveTree(ctx, env, colors, villageGrove, tree),
    })),
    ...nearHouses.map(({ house, rolls }) => {
      const d = (house.depth - FAR) / (1 - FAR)
      const groundY = village(house.x) + vh * lerp(0, 0.045, d)
      return {
        baseY: groundY,
        paint: () =>
          paintHouse(
            ctx,
            rolls,
            env,
            colors,
            house.x,
            groundY,
            house.width * u * lerp(0.8, 1.12, d),
            cfg.houseDecorationChance
          ),
      }
    }),
  ]
  village3d.sort((a, b) => a.baseY - b.baseY)
  for (const item of village3d) item.paint()

  // Azure band hill: a few small pines, kept to the sides so the village stays clear
  paintHill(ctx, w, h, band, colors.hills.band.fill, env)
  paintHillSwooshes(ctx, w, vh, band, colors.hills.band, rng)
  for (const [from, to] of [
    [-w * 0.02, w * 0.28],
    [w * 0.72, w * 1.02],
  ] as const) {
    paintGrove(ctx, rng, env, colors, {
      from,
      to,
      count: mobile ? 2 : 3,
      minHeight: 70 * u,
      maxHeight: 130 * u,
      baseY: (x) => front(x) + 4,
      trees: colors.trees.mid,
      decorated: cfg.treeDecorationChance,
    })
  }

  // Front hill, with the big foreground pines cut off by the screen's bottom edge
  paintHill(ctx, w, h, front, colors.hills.front.fill, env)
  paintHillSwooshes(ctx, w, vh, front, colors.hills.front, rng)
  for (const [from, to, count] of [
    [-w * 0.03, w * 0.2, mobile ? 3 : 5],
    [w * 0.84, w * 1.03, mobile ? 2 : 4],
  ] as const) {
    paintGrove(ctx, rng, env, colors, {
      from,
      to,
      count,
      minHeight: 160 * u,
      maxHeight: 300 * u,
      baseY: (_x, height) => h + height * 0.05,
      trees: colors.trees.near,
      decorated: Math.min(1, cfg.treeDecorationChance * 1.5),
    })
  }

  // A light wash over the scenery keeps the page content readable. 'source-atop'
  // only tints what is already painted, so the transparent sky stays transparent.
  ctx.globalCompositeOperation = 'source-atop'
  ctx.fillStyle = rgba(colors.veil.color, colors.veil.alpha)
  ctx.fillRect(0, 0, w, h)
  ctx.globalCompositeOperation = 'source-over'

  // Work out the area of each glow group and which later-painted shapes cover it
  for (const { order: groupOrder, group } of pending) {
    let x0 = Number.POSITIVE_INFINITY
    let y0 = Number.POSITIVE_INFINITY
    let x1 = Number.NEGATIVE_INFINITY
    let y1 = Number.NEGATIVE_INFINITY
    for (const glowSpot of [...group.windows, ...group.lights]) {
      x0 = Math.min(x0, glowSpot.x - glowSpot.r)
      y0 = Math.min(y0, glowSpot.y - glowSpot.r)
      x1 = Math.max(x1, glowSpot.x + glowSpot.r)
      y1 = Math.max(y1, glowSpot.y + glowSpot.r)
    }
    if (x1 <= x0 || y1 <= y0) continue
    group.bounds = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
    group.cover = occluders
      .filter((o) => o.order > groupOrder && intersects(o.bounds, group.bounds))
      .map((o) => o.path)
    scene.groups.push(group)
  }

  // Smoke rises above its chimney and drifts sideways, so it can pass behind a tree or
  // a nearer house just like a glow
  for (const { order: chimneyOrder, spot } of pendingChimneys) {
    const bounds = {
      x: spot.x - 70 * spot.scale,
      y: spot.y - 100 * spot.scale,
      w: 140 * spot.scale,
      h: 110 * spot.scale,
    }
    scene.chimneys.push({
      ...spot,
      bounds,
      cover: occluders
        .filter((o) => o.order > chimneyOrder && intersects(o.bounds, bounds))
        .map((o) => o.path),
    })
  }

  return scene
}

// ── Santa's sleigh ──────────────────────────────────────────────────────────

/**
 * One reindeer, drawn live around (cx, cy). `gallop` is its leg phase in radians; the
 * legs swing and lift continuously and the head nods with the stride. Pass `flash`
 * (0-1) for the lead reindeer to make its nose glow red (with `glow`, a soft red sprite).
 *
 * Flat shading only, like the rest of the scenery: a darker pair of legs and a darker
 * underside under the lit body, a highlight along the back, a harness with a gold
 * buckle and bone-toned antlers, so the deer reads as a solid toy rather than an
 * outline. `poke` (0-1) is how far a click reaction has got: the deer hops, tips and
 * squashes a little, which is what tells the visitor it can be clicked.
 */
export const paintReindeer = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  gallop: number,
  colors: ChristmasColors['santa'],
  flash?: number,
  glow?: HTMLCanvasElement | null,
  poke = 0
) => {
  const base = colors.deer
  const dark = shadeOf(base, 0.32)
  const light = tintOf(base, 0.3)
  const harness = mixRGB(colors.trim, base, 0.45)
  const bone = mixRGB(colors.fur, base, 0.35)

  ctx.save()
  if (poke > 0) {
    // A hop that leaves the ground and comes back down, with a short squash.
    const lift = Math.sin(Math.PI * poke)
    ctx.translate(0, -lift * 9)
    ctx.rotate(Math.sin(poke * TAU) * 0.14)
    ctx.scale(1 + lift * 0.08, 1 - lift * 0.06)
  }

  ctx.lineCap = 'round'

  // Legs: the front pair and the back pair swing out of step, and each foot lifts.
  // The pair behind is a shade darker, which is all the depth the flat style needs.
  const legs = [
    { hip: 10, offset: 0, back: true },
    { hip: 7, offset: 0.7, back: true },
    { hip: -10, offset: Math.PI * 0.9, back: false },
    { hip: -7, offset: Math.PI * 0.9 + 0.7, back: false },
  ]
  const legAt = (leg: { hip: number; offset: number }) => {
    const phase = gallop + leg.offset
    const lift = Math.max(0, Math.cos(phase)) * 5
    return {
      x1: cx + leg.hip,
      y1: cy + 6,
      x2: cx + leg.hip + Math.sin(phase) * 13,
      y2: cy + 18 - lift,
    }
  }
  for (const pass of [
    { rgb: dark, width: 3, back: true },
    { rgb: base, width: 2.6, back: false },
  ]) {
    ctx.strokeStyle = rgba(pass.rgb)
    ctx.lineWidth = pass.width
    ctx.beginPath()
    for (const leg of legs.filter((l) => l.back === pass.back)) {
      const { x1, y1, x2, y2 } = legAt(leg)
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
    }
    ctx.stroke()
  }
  // Hooves, in the darkest tone
  ctx.strokeStyle = rgba(shadeOf(base, 0.6))
  ctx.lineWidth = 3
  ctx.beginPath()
  for (const leg of legs) {
    const { x2, y2 } = legAt(leg)
    ctx.moveTo(x2 - 0.6, y2 - 1.6)
    ctx.lineTo(x2 + 0.6, y2)
  }
  ctx.stroke()

  // Body: a darker underside, then the lit body a little higher, then a highlight.
  ctx.fillStyle = rgba(dark)
  ctx.beginPath()
  ctx.ellipse(cx, cy + 1.7, 15, 8, 0, 0, TAU)
  ctx.fill()
  ctx.fillStyle = rgba(base)
  ctx.beginPath()
  ctx.ellipse(cx, cy, 14.6, 7.2, 0, 0, TAU)
  ctx.fill()
  ctx.fillStyle = rgba(light, 0.7)
  ctx.beginPath()
  ctx.ellipse(cx + 1, cy - 3.4, 10, 2.6, 0, 0, TAU)
  ctx.fill()

  // White tail tuft
  ctx.fillStyle = rgba(colors.fur)
  circle(ctx, cx - 15.4, cy - 2.8, 2.6)

  // Harness strap across the chest, with the gold buckle that matches the reins
  ctx.strokeStyle = rgba(harness)
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cx + 7.5, cy - 6.2)
  ctx.lineTo(cx + 10.5, cy + 5.6)
  ctx.stroke()
  ctx.fillStyle = rgba(colors.trim)
  circle(ctx, cx + 9.6, cy - 0.6, 1.7)

  // Neck, head and antlers nod together
  ctx.save()
  ctx.translate(0, Math.sin(gallop) * 1.3)

  // Neck: a dark edge under the body tone, so it separates from the chest
  ctx.strokeStyle = rgba(dark)
  ctx.lineWidth = 7
  ctx.beginPath()
  ctx.moveTo(cx + 11, cy - 1.6)
  ctx.lineTo(cx + 20, cy - 13.6)
  ctx.stroke()
  ctx.strokeStyle = rgba(base)
  ctx.lineWidth = 5.4
  ctx.beginPath()
  ctx.moveTo(cx + 11, cy - 2)
  ctx.lineTo(cx + 20, cy - 14)
  ctx.stroke()

  // Head, with a darker muzzle and a lit cheek
  ctx.fillStyle = rgba(dark)
  ctx.beginPath()
  ctx.ellipse(cx + 23, cy - 14.2, 6.7, 4.2, 0.35, 0, TAU)
  ctx.fill()
  ctx.fillStyle = rgba(base)
  ctx.beginPath()
  ctx.ellipse(cx + 23, cy - 15, 6.3, 3.8, 0.35, 0, TAU)
  ctx.fill()
  ctx.fillStyle = rgba(light, 0.75)
  ctx.beginPath()
  ctx.ellipse(cx + 23.4, cy - 16.2, 3.6, 1.5, 0.35, 0, TAU)
  ctx.fill()
  ctx.fillStyle = rgba(shadeOf(base, 0.2))
  ctx.beginPath()
  ctx.ellipse(cx + 26.6, cy - 13.4, 2.6, 1.9, 0.35, 0, TAU)
  ctx.fill()
  // Eye and ear
  ctx.fillStyle = rgba(shadeOf(base, 0.72))
  circle(ctx, cx + 21.2, cy - 17.4, 0.95)
  ctx.fillStyle = rgba(dark)
  ctx.beginPath()
  ctx.moveTo(cx + 18.4, cy - 18.6)
  ctx.lineTo(cx + 17, cy - 22.4)
  ctx.lineTo(cx + 20.6, cy - 19.8)
  ctx.closePath()
  ctx.fill()

  // Antlers in bone, a lighter branch in front of the darker one
  ctx.strokeStyle = rgba(bone)
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.moveTo(cx + 21, cy - 18)
  ctx.lineTo(cx + 17, cy - 31)
  ctx.moveTo(cx + 19, cy - 25)
  ctx.lineTo(cx + 24, cy - 30)
  ctx.moveTo(cx + 24, cy - 18)
  ctx.lineTo(cx + 26, cy - 30)
  ctx.stroke()
  ctx.strokeStyle = rgba(tintOf(bone, 0.45))
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(cx + 26, cy - 30)
  ctx.lineTo(cx + 29, cy - 33)
  ctx.moveTo(cx + 17, cy - 31)
  ctx.lineTo(cx + 14.5, cy - 34)
  ctx.stroke()

  const noseX = cx + 29.5
  const noseY = cy - 13.5
  ctx.fillStyle = rgba(base)
  if (flash === undefined) {
    circle(ctx, noseX, noseY, 1.6)
  } else {
    if (glow) {
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      ctx.globalAlpha = flash
      ctx.drawImage(glow, noseX - 16, noseY - 16, 32, 32)
      ctx.restore()
    }
    circle(ctx, noseX, noseY, 2.6)
    ctx.fillStyle = rgba(colors.nose, 0.35 + 0.65 * flash)
    circle(ctx, noseX, noseY, 2.6)
    ctx.fillStyle = rgba(WHITE, 0.5 * flash)
    circle(ctx, noseX - 0.7, noseY - 0.7, 0.9)
  }
  ctx.restore()

  ctx.restore()
}

/**
 * The flat sparkle burst a clicked reindeer answers with: an expanding ring and four
 * small diamonds. `t` runs 0 to 1 over the burst's life; everything fades with it.
 */
export const paintPokeBurst = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  t: number,
  rgb: string
) => {
  const fade = 1 - t
  ctx.save()
  ctx.strokeStyle = rgba(rgb, 0.75 * fade)
  ctx.lineWidth = Math.max(1, size * 0.08)
  ctx.beginPath()
  ctx.arc(x, y, size * (0.5 + 0.9 * t), 0, TAU)
  ctx.stroke()

  ctx.fillStyle = rgba(rgb, 0.9 * fade)
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * TAU + Math.PI / 4
    const distance = size * (0.55 + 0.75 * t)
    const px = x + Math.cos(angle) * distance
    const py = y + Math.sin(angle) * distance
    const arm = size * 0.16 * (1 - t * 0.4)
    ctx.beginPath()
    ctx.moveTo(px, py - arm)
    ctx.lineTo(px + arm, py)
    ctx.lineTo(px, py + arm)
    ctx.lineTo(px - arm, py)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

/**
 * The sleigh with Santa, in the sprite's own units (SLEIGH_SIZE, facing right).
 * Flat shading only: a shadow under the runners, a darker underside and plank lines
 * on the sled, a gold rim, a sack with folds and a tie, and Santa with a shaded
 * coat, a belt and a mitten on the reins.
 */
const paintSleighPart = (
  ctx: CanvasRenderingContext2D,
  colors: ChristmasColors['santa']
) => {
  const body = colors.body
  const bodyShade = shadeOf(body, 0.3)
  const trimShade = shadeOf(colors.trim, 0.32)
  const coatShade = shadeOf(colors.coat, 0.3)

  // Shadow under the runners: the only thing a picture of a flying sled needs to
  // stop looking pasted on.
  ctx.fillStyle = rgba(BLACK, 0.16)
  ctx.beginPath()
  ctx.ellipse(54, 74.5, 48, 4.6, 0, 0, TAU)
  ctx.fill()

  // Runners: a darker lip under a gold rail, with the two struts
  ctx.lineCap = 'round'
  ctx.strokeStyle = rgba(trimShade)
  ctx.lineWidth = 4.6
  ctx.beginPath()
  ctx.moveTo(6, 73.4)
  ctx.lineTo(92, 73.4)
  ctx.quadraticCurveTo(109, 73.4, 104, 55.4)
  ctx.stroke()
  ctx.strokeStyle = rgba(colors.trim)
  ctx.lineWidth = 2.6
  ctx.beginPath()
  ctx.moveTo(6, 72)
  ctx.lineTo(92, 72)
  ctx.quadraticCurveTo(108, 72, 104, 56)
  ctx.moveTo(24, 63)
  ctx.lineTo(24, 72)
  ctx.moveTo(72, 63)
  ctx.lineTo(72, 72)
  ctx.stroke()

  // The body: shaded underside, the body over it, then plank lines and a gold rim
  const traceBody = (dy: number) => {
    ctx.beginPath()
    ctx.moveTo(8, 40 + dy)
    ctx.lineTo(90, 40 + dy)
    ctx.quadraticCurveTo(98, 58 + dy, 80, 64 + dy)
    ctx.lineTo(16, 64 + dy)
    ctx.quadraticCurveTo(4, 60 + dy, 8, 40 + dy)
    ctx.closePath()
  }
  ctx.fillStyle = rgba(bodyShade)
  traceBody(1.8)
  ctx.fill()
  ctx.fillStyle = rgba(body)
  traceBody(0)
  ctx.fill()

  ctx.save()
  traceBody(0)
  ctx.clip()
  ctx.strokeStyle = rgba(bodyShade, 0.7)
  ctx.lineWidth = 1
  ctx.beginPath()
  for (const y of [48, 55, 61.5]) {
    ctx.moveTo(6, y)
    ctx.lineTo(96, y)
  }
  ctx.stroke()
  ctx.fillStyle = rgba(tintOf(body, 0.2), 0.35)
  ctx.fillRect(8, 41, 82, 2.5)
  ctx.restore()

  ctx.fillStyle = rgba(colors.trim)
  ctx.fillRect(8, 38, 82, 4)
  ctx.fillStyle = rgba(trimShade, 0.7)
  ctx.fillRect(8, 41.2, 82, 1)

  // Sack of presents, with a fold, a tie and a highlight
  const sack = colors.sack
  ctx.fillStyle = rgba(shadeOf(sack, 0.32))
  circle(ctx, 28, 35.2, 14)
  ctx.fillStyle = rgba(sack)
  circle(ctx, 28, 34, 13.6)
  ctx.fillStyle = rgba(shadeOf(sack, 0.45))
  ctx.fillRect(21.5, 21.5, 13, 3)
  ctx.fillStyle = rgba(tintOf(sack, 0.25), 0.8)
  circle(ctx, 24.5, 29, 4.6)

  // Santa: shadowed side of the coat, then the lit coat, beard, face, hat, belt and
  // the arm that holds the reins.
  ctx.fillStyle = rgba(coatShade)
  ctx.beginPath()
  ctx.ellipse(59.4, 36.6, 11, 12, 0, 0, TAU)
  ctx.fill()
  ctx.fillStyle = rgba(colors.coat)
  ctx.beginPath()
  ctx.ellipse(58, 36, 10.6, 11.6, 0, 0, TAU)
  ctx.fill()

  // Belt: darkened only inside the coat, with a gold buckle
  ctx.save()
  ctx.beginPath()
  ctx.ellipse(58, 36, 10.6, 11.6, 0, 0, TAU)
  ctx.clip()
  ctx.fillStyle = rgba(BLACK, 0.35)
  ctx.fillRect(46, 40, 24, 4.4)
  ctx.restore()
  ctx.fillStyle = rgba(colors.trim)
  ctx.fillRect(56.4, 40.4, 3.6, 3.6)

  // Arm to the reins: a dark edge under the coat color
  ctx.strokeStyle = rgba(coatShade)
  ctx.lineWidth = 5.4
  ctx.beginPath()
  ctx.moveTo(62, 32)
  ctx.lineTo(SLEIGH_HAND.x, SLEIGH_HAND.y)
  ctx.stroke()
  ctx.strokeStyle = rgba(colors.coat)
  ctx.lineWidth = 3.8
  ctx.beginPath()
  ctx.moveTo(62, 32)
  ctx.lineTo(SLEIGH_HAND.x, SLEIGH_HAND.y)
  ctx.stroke()

  // Beard, then the face, with a rosy cheek
  ctx.fillStyle = rgba(shadeOf(colors.fur, 0.12))
  ctx.beginPath()
  ctx.ellipse(58, 25.8, 5.4, 5.4, 0, 0, TAU)
  ctx.fill()
  ctx.fillStyle = rgba(colors.fur)
  ctx.beginPath()
  ctx.ellipse(58, 25, 5, 5, 0, 0, TAU)
  ctx.fill()
  ctx.fillStyle = rgba(colors.skin)
  circle(ctx, 58, 20, 6)
  ctx.fillStyle = rgba(mixRGB(colors.skin, colors.nose, 0.4), 0.5)
  circle(ctx, 61, 21.4, 2)

  // Hat with a fur band and a pompom
  ctx.fillStyle = rgba(colors.coat)
  ctx.beginPath()
  ctx.moveTo(51, 18)
  ctx.lineTo(58, 4)
  ctx.quadraticCurveTo(66, 6, 69, 14)
  ctx.lineTo(65, 18)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = rgba(coatShade, 0.55)
  ctx.beginPath()
  ctx.moveTo(58, 4)
  ctx.quadraticCurveTo(66, 6, 69, 14)
  ctx.lineTo(65, 18)
  ctx.lineTo(61, 18)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = rgba(colors.fur)
  ctx.fillRect(51, 16, 14, 4)
  circle(ctx, 70, 13, 3)

  // The mitten on the reins
  ctx.fillStyle = rgba(colors.fur)
  circle(ctx, SLEIGH_HAND.x, SLEIGH_HAND.y, 2.7)
}

/** The sleigh with Santa as one sprite (the reindeer are drawn live, see paintReindeer). */
export const buildSleighSprite = (
  colors: ChristmasColors,
  pixelScale: number
) => {
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(SLEIGH_PART_WIDTH * pixelScale)
  canvas.height = Math.ceil(SLEIGH_SIZE.height * pixelScale)
  const sctx = canvas.getContext('2d')
  if (sctx) {
    sctx.scale(pixelScale, pixelScale)
    paintSleighPart(sctx, colors.santa)
  }
  return canvas
}
