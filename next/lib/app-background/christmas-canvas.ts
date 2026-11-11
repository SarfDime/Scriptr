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

  for (let i = 1; i < points.length - 1; i++) {
    const peak = points[i]
    const left = points[i - 1]
    const right = points[i + 1]
    if (!peak || !left || !right || !peak.peak) continue

    // Shaded face on the right-hand side of each peak
    ctx.beginPath()
    ctx.moveTo(peak.x, peak.y)
    ctx.lineTo(right.x, right.y)
    ctx.lineTo(lerp(peak.x, right.x, 0.25), baseY + vh * 0.04)
    ctx.closePath()
    ctx.fillStyle = rgba(BLACK, shadeAlpha)
    ctx.fill()

    // Snow cap with a zigzag lower edge
    const depth = 0.3 + rng() * 0.12
    const lx = lerp(peak.x, left.x, depth)
    const ly = lerp(peak.y, left.y, depth)
    const rx = lerp(peak.x, right.x, depth)
    const ry = lerp(peak.y, right.y, depth)
    const mid = (ly + ry) / 2
    const zig = (baseY - peak.y) * 0.06
    ctx.beginPath()
    ctx.moveTo(peak.x, peak.y)
    ctx.lineTo(lx, ly)
    ctx.lineTo(lerp(lx, rx, 0.22), mid + zig)
    ctx.lineTo(lerp(lx, rx, 0.45), mid - zig * 0.3)
    ctx.lineTo(lerp(lx, rx, 0.7), mid + zig * 1.1)
    ctx.lineTo(rx, ry)
    ctx.closePath()
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
  const half = width / 2
  const wallHeight = width * 0.46
  const roofHeight = width * 0.4
  const overhang = width * 0.07
  const eaveY = groundY - wallHeight
  const peakY = eaveY - roofHeight

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

  // Chimney first: the roof covers its foot
  const side = rolls.side < 0.5 ? -1 : 1
  const chimneyX = x + side * half * 0.5
  const slopeY =
    peakY + (Math.abs(chimneyX - x) / (half + overhang)) * (eaveY - peakY)
  const chimneyWidth = width * 0.1
  const chimneyHeight = roofHeight * 0.55
  const chimneyTop = slopeY - chimneyHeight
  ctx.fillStyle = rgba(c.chimney)
  ctx.fillRect(
    chimneyX - chimneyWidth / 2,
    chimneyTop,
    chimneyWidth,
    chimneyHeight + roofHeight * 0.2
  )
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

  // Walls, with the right side in shade
  ctx.fillStyle = rgba(c.wall)
  ctx.fillRect(x - half, eaveY, width, wallHeight)
  ctx.fillStyle = rgba(c.wallShade)
  ctx.fillRect(x + half * 0.35, eaveY, half * 0.65, wallHeight)

  // Windows and door
  const windowWidth = width * 0.15
  const windowHeight = windowWidth * 1.25
  const windowY = eaveY + wallHeight * 0.2
  const bar = Math.max(1, windowWidth * 0.08)
  for (const [i, dx] of [-half * 0.55, half * 0.05].entries()) {
    const roll = rolls.windows[i]
    const wx = x + dx - windowWidth / 2
    ctx.fillStyle = rgba(c.window)
    ctx.fillRect(wx, windowY, windowWidth, windowHeight)
    ctx.fillStyle = rgba(c.frame, 0.8)
    ctx.fillRect(wx + windowWidth / 2 - bar / 2, windowY, bar, windowHeight)
    ctx.fillRect(wx, windowY + windowHeight / 2 - bar / 2, windowWidth, bar)
    env.glow().windows.push({
      x: wx + windowWidth / 2,
      y: windowY + windowHeight / 2,
      r: windowWidth * 2.4,
      phase: (roll?.phase ?? 0) * TAU,
      rate: 0.0008 + (roll?.rate ?? 0) * 0.0012,
    })
  }
  const doorWidth = width * 0.16
  const doorHeight = wallHeight * 0.62
  const doorX = x + half * 0.55 - doorWidth / 2
  ctx.fillStyle = rgba(c.door)
  ctx.fillRect(doorX, groundY - doorHeight, doorWidth, doorHeight)
  if (rolls.litDoor < 0.35) {
    ctx.fillStyle = rgba(c.window, 0.9)
    ctx.fillRect(
      doorX + doorWidth * 0.18,
      groundY - doorHeight * 0.9,
      doorWidth * 0.64,
      doorHeight * 0.75
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
  ctx.fillStyle = rgba(c.snowShade, 0.45)
  ctx.beginPath()
  ctx.moveTo(x, peakY - roofHeight * 0.04)
  ctx.lineTo(snowRight, snowEdgeY)
  ctx.lineTo(x, snowEdgeY)
  ctx.closePath()
  ctx.fill()

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
    const wreathY = groundY - doorHeight * 0.68
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
 */
export const paintReindeer = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  gallop: number,
  colors: ChristmasColors['santa'],
  flash?: number,
  glow?: HTMLCanvasElement | null
) => {
  ctx.fillStyle = rgba(colors.deer)
  ctx.strokeStyle = rgba(colors.deer)
  ctx.lineCap = 'round'

  // Legs: the front pair and the back pair swing out of step, and each foot lifts
  const legs = [
    { hip: 10, offset: 0 },
    { hip: 7, offset: 0.7 },
    { hip: -10, offset: Math.PI * 0.9 },
    { hip: -7, offset: Math.PI * 0.9 + 0.7 },
  ]
  ctx.lineWidth = 2.6
  ctx.beginPath()
  for (const leg of legs) {
    const phase = gallop + leg.offset
    const lift = Math.max(0, Math.cos(phase)) * 5
    ctx.moveTo(cx + leg.hip, cy + 6)
    ctx.lineTo(cx + leg.hip + Math.sin(phase) * 13, cy + 18 - lift)
  }
  ctx.stroke()

  ctx.beginPath()
  ctx.ellipse(cx, cy, 15, 8, 0, 0, TAU)
  ctx.fill()
  ctx.fillStyle = rgba(colors.fur)
  circle(ctx, cx - 15, cy - 3, 2.4)
  ctx.fillStyle = rgba(colors.deer)

  // Neck, head and antlers nod together
  ctx.save()
  ctx.translate(0, Math.sin(gallop) * 1.3)
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(cx + 11, cy - 2)
  ctx.lineTo(cx + 20, cy - 14)
  ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(cx + 23, cy - 15, 6.5, 4, 0.35, 0, TAU)
  ctx.fill()
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.moveTo(cx + 21, cy - 18)
  ctx.lineTo(cx + 17, cy - 31)
  ctx.moveTo(cx + 19, cy - 25)
  ctx.lineTo(cx + 24, cy - 30)
  ctx.moveTo(cx + 24, cy - 18)
  ctx.lineTo(cx + 26, cy - 30)
  ctx.stroke()

  const noseX = cx + 29.5
  const noseY = cy - 13.5
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
}

const paintSleighPart = (
  ctx: CanvasRenderingContext2D,
  colors: ChristmasColors['santa']
) => {
  // Runners, red body with a gold rim, and a sack of presents
  ctx.lineCap = 'round'
  ctx.strokeStyle = rgba(colors.trim)
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(6, 72)
  ctx.lineTo(92, 72)
  ctx.quadraticCurveTo(108, 72, 104, 56)
  ctx.moveTo(24, 64)
  ctx.lineTo(24, 72)
  ctx.moveTo(72, 64)
  ctx.lineTo(72, 72)
  ctx.stroke()

  ctx.fillStyle = rgba(colors.body)
  ctx.beginPath()
  ctx.moveTo(8, 40)
  ctx.lineTo(90, 40)
  ctx.quadraticCurveTo(98, 58, 80, 64)
  ctx.lineTo(16, 64)
  ctx.quadraticCurveTo(4, 60, 8, 40)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = rgba(colors.trim)
  ctx.fillRect(8, 38, 82, 4)

  ctx.fillStyle = rgba(colors.sack)
  circle(ctx, 28, 34, 14)

  // Santa: coat, beard, face, hat with a pompom, and an arm holding the reins
  ctx.strokeStyle = rgba(colors.coat)
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(62, 32)
  ctx.lineTo(SLEIGH_HAND.x, SLEIGH_HAND.y)
  ctx.stroke()
  ctx.fillStyle = rgba(colors.coat)
  ctx.beginPath()
  ctx.ellipse(58, 36, 11, 12, 0, 0, TAU)
  ctx.fill()
  ctx.fillStyle = rgba(colors.skin)
  circle(ctx, 58, 20, 6)
  ctx.fillStyle = rgba(colors.fur)
  ctx.beginPath()
  ctx.ellipse(58, 25, 5, 5, 0, 0, TAU)
  ctx.fill()
  ctx.fillStyle = rgba(colors.coat)
  ctx.beginPath()
  ctx.moveTo(51, 18)
  ctx.lineTo(58, 4)
  ctx.quadraticCurveTo(66, 6, 69, 14)
  ctx.lineTo(65, 18)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = rgba(colors.fur)
  ctx.fillRect(51, 16, 14, 4)
  circle(ctx, 70, 13, 3)
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
