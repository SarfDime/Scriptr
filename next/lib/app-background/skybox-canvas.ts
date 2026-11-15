import type { SkyState } from '@shared/types/skybox.types'
import { createColorResolver, TAU } from '@/lib/star-canvas'
import { paintSun } from './skybox-sun'

// Drawing for the shared sky (components/ui/app-background/SkyboxCanvas.tsx). Flat shapes
// like the Christmas scenery: a cut-paper sun (skybox-sun.ts), a disc with craters and
// darker seas for the moon, and stacked flat puffs for the clouds. The sky gradient is
// the only smooth thing in the picture.
//
// The sky itself is painted at most twice a second normally and at the effects frame
// cap in immersive mode; stars and clouds are drawn live at that cap.

export const rgba = (rgb: string, alpha = 1) => `rgba(${rgb}, ${alpha})`

/**
 * The theme color resolver with its answers kept: a lookup builds a DOM node and
 * reads a pixel back, and the sky asks for the same few dozen keys every frame.
 * Make a new one after a theme change.
 */
export const createSkyColorResolver = () => {
  const resolve = createColorResolver()
  const cache = new Map<string, string>()
  return (key: string) => {
    const known = cache.get(key)
    if (known !== undefined) return known
    const value = resolve(key)
    cache.set(key, value)
    return value
  }
}

/** Brightness of an "r, g, b" string, 0 to 1. */
const lumaOf = (rgb: string) => {
  const [r = 0, g = 0, b = 0] = rgb.split(',').map(Number)
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

/** Scales an "r, g, b" string toward black (`k` < 1) — used for crater shadow. */
const darken = (rgb: string, k: number) => {
  const [r = 0, g = 0, b = 0] = rgb.split(',').map(Number)
  return `${Math.round(r * k)}, ${Math.round(g * k)}, ${Math.round(b * k)}`
}

/** Soft round glow, fading to nothing so there is no visible edge. */
const paintGlow = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  rgb: string,
  alpha: number
) => {
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
  gradient.addColorStop(0, rgba(rgb, alpha))
  gradient.addColorStop(0.45, rgba(rgb, alpha * 0.35))
  gradient.addColorStop(1, rgba(rgb, 0))
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, TAU)
  ctx.fill()
}

// ── Moon ────────────────────────────────────────────────────────────────────

/**
 * Crater layout, as fractions of the moon's radius. Spread over the whole disc
 * (nothing piled in the middle) and small enough to stay clear of the rim; the
 * clip in paintMoon catches anything that would spill.
 */
const MOON_CRATERS = [
  { x: -0.46, y: -0.34, r: 0.17 },
  { x: -0.18, y: -0.52, r: 0.11 },
  { x: 0.14, y: -0.44, r: 0.14 },
  { x: 0.44, y: -0.26, r: 0.12 },
  { x: -0.54, y: 0.08, r: 0.13 },
  { x: -0.22, y: 0.18, r: 0.09 },
  { x: 0.08, y: 0.02, r: 0.07 },
  { x: 0.38, y: 0.12, r: 0.16 },
  { x: -0.36, y: 0.46, r: 0.15 },
  { x: 0.16, y: 0.42, r: 0.1 },
  { x: 0.52, y: 0.42, r: 0.07 },
  { x: 0.24, y: 0.64, r: 0.05 },
  { x: -0.1, y: -0.16, r: 0.05 },
] as const

/**
 * The darker "seas", as polygons in units of the moon's radius. Two flat patches
 * are enough to stop the disc reading as a plain circle.
 */
const MOON_MARIA: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
  [
    [-0.56, -0.08],
    [-0.3, -0.36],
    [-0.04, -0.3],
    [-0.04, 0.06],
    [-0.24, 0.26],
    [-0.52, 0.16],
  ],
  [
    [0.06, -0.1],
    [0.34, -0.22],
    [0.5, 0.04],
    [0.3, 0.24],
    [0.06, 0.14],
  ],
]

/**
 * One crater with depth: a shadowed bowl, a lit rim on the top-left (where the
 * light comes from) and a darker lip on the bottom-right, so it reads as a hollow
 * rather than a spot.
 */
const paintCrater = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  rgb: string,
  alpha: number
) => {
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, TAU)
  ctx.fillStyle = rgba(darken(rgb, 0.8), alpha * 0.5)
  ctx.fill()

  // Shadow inside the bowl, pushed away from the light.
  ctx.beginPath()
  ctx.arc(cx + r * 0.22, cy + r * 0.22, r * 0.72, 0, TAU)
  ctx.fillStyle = rgba(darken(rgb, 0.6), alpha * 0.45)
  ctx.fill()

  // Lit inner wall on the light side.
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.9, Math.PI * 1.05, Math.PI * 1.6)
  ctx.strokeStyle = rgba('255, 255, 255', alpha * 0.5)
  ctx.lineWidth = Math.max(0.8, r * 0.24)
  ctx.stroke()

  // Dark outer lip on the far side, so the rim looks raised.
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.98, Math.PI * 0.05, Math.PI * 0.6)
  ctx.strokeStyle = rgba(darken(rgb, 0.68), alpha * 0.4)
  ctx.lineWidth = Math.max(0.8, r * 0.2)
  ctx.stroke()
}

/** A round moon: seas, then craters, all clipped to the disc. */
const paintMoon = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  rgb: string,
  alpha: number
) => {
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, TAU)
  ctx.fillStyle = rgba(rgb, alpha)
  ctx.fill()

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, TAU)
  ctx.clip()
  ctx.lineCap = 'round'

  ctx.fillStyle = rgba(darken(rgb, 0.88), alpha * 0.55)
  for (const patch of MOON_MARIA) {
    ctx.beginPath()
    patch.forEach(([px, py], i) => {
      const x = cx + px * r
      const y = cy + py * r
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.closePath()
    ctx.fill()
  }

  for (const crater of MOON_CRATERS) {
    paintCrater(
      ctx,
      cx + crater.x * r,
      cy + crater.y * r,
      crater.r * r,
      rgb,
      alpha
    )
  }

  ctx.restore()
}

// ── Sky ─────────────────────────────────────────────────────────────────────

/**
 * The still part of the sky: the vertical gradient, the sun and the moon. The
 * `ctx` transform must already map 1 unit to 1 CSS px.
 */
export const paintSky = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: SkyState,
  clock: number
) => {
  const min = Math.min(w, h)

  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
  ctx.clearRect(0, 0, w, h)

  const sky = ctx.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, rgba(state.skyTop))
  sky.addColorStop(1, rgba(state.skyBottom))
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h)

  // The glow breathes a little, so a still sky does not look like a screenshot.
  const breath = 0.9 + 0.1 * Math.sin(clock * 0.0009)

  // The sun: two soft glows, then the flat disc. The additive layers are toned down
  // on a bright sky so a pale theme is not washed to white.
  if (state.sun.visible) {
    const sx = state.sun.x * w
    const sy = state.sun.y * h
    const r = state.sun.radius * min
    paintGlow(ctx, sx, sy, r * 4.8, state.sun.glow, 0.34 * breath)
    paintGlow(ctx, sx, sy, r * 1.85, state.sun.glow, 0.62 * breath)
    const skyLuma = (lumaOf(state.skyTop) + lumaOf(state.skyBottom)) / 2
    paintSun(ctx, sx, sy, r, state.sun, 1 - 0.55 * skyLuma)
  }

  if (state.moon.opacity > 0.04) {
    const mx = state.moon.x * w
    const my = state.moon.y * h
    const r = state.moon.radius * min
    paintGlow(ctx, mx, my, r * 3.6, state.moon.color, state.moon.opacity * 0.4)
    paintMoon(ctx, mx, my, r, state.moon.color, state.moon.opacity)
  }
}

// ── Stars ───────────────────────────────────────────────────────────────────

/** A star, in viewport fractions so a resize does not reshuffle the field. */
export type SkyStar = {
  x: number
  y: number
  /** Radius, as a fraction of the viewport's smaller side. */
  r: number
  phase: number
  rate: number
}

export const buildStars = (count: number, seed: number): Array<SkyStar> => {
  let s = seed >>> 0
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return Array.from({ length: count }, () => ({
    x: next(),
    y: next() * 0.92,
    // Mostly tiny: a high `pow` makes anything above a speck rare, and the
    // ceiling is lower, so even a big star stays small.
    r: 0.0005 + next() ** 5.5 * 0.0014,
    phase: next() * TAU,
    rate: 0.0012 + next() * 0.0022,
  }))
}

/**
 * One star as crossed lines: a soft core with four short arms. The arms are drawn
 * well below the core's brightness, so they fade into the sky instead of ending on
 * a hard point.
 */
const paintStar = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  brightness: number
) => {
  const arm = r * 1.9
  ctx.globalAlpha = brightness * 0.45
  ctx.lineWidth = Math.max(0.5, r * 0.55)
  ctx.beginPath()
  ctx.moveTo(x - arm, y)
  ctx.lineTo(x + arm, y)
  ctx.moveTo(x, y - arm)
  ctx.lineTo(x, y + arm)
  ctx.stroke()

  // The biggest few also get a faint diagonal, which is what reads as a sparkle.
  if (r > 0.0013) {
    const d = arm * 0.45
    ctx.globalAlpha = brightness * 0.22
    ctx.beginPath()
    ctx.moveTo(x - d, y - d)
    ctx.lineTo(x + d, y + d)
    ctx.moveTo(x - d, y + d)
    ctx.lineTo(x + d, y - d)
    ctx.stroke()
  }

  ctx.globalAlpha = brightness * 0.9
  ctx.beginPath()
  ctx.arc(x, y, r * 0.7, 0, TAU)
  ctx.fill()
  ctx.globalAlpha = 1
}

/**
 * Stars, drawn as crossed lines rather than dots. A third twinkle and the rest
 * hold steady, so the field reads as a sky and not as noise.
 */
export const paintStars = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  stars: ReadonlyArray<SkyStar>,
  state: SkyState,
  clock: number
) => {
  const alpha = state.starVisibility
  if (alpha <= 0.02) return
  const min = Math.min(w, h)

  ctx.strokeStyle = rgba(state.star, alpha * 0.55)
  ctx.fillStyle = rgba(state.star, alpha * 0.8)
  ctx.lineCap = 'round'

  for (let i = 0; i < stars.length; i++) {
    const star = stars[i]
    if (!star) continue
    const twinkle =
      i % 3 === 0 ? 0.55 + 0.45 * Math.sin(clock * star.rate + star.phase) : 0.9
    if (twinkle < 0.25) continue
    paintStar(ctx, star.x * w, star.y * h, star.r * min, twinkle)
  }
}

// ── Clouds ──────────────────────────────────────────────────────────────────

/** One sparse cloud: stacked flat puffs, drifting slowly to the right. */
export type SkyCloud = {
  /** Start position and drift speed in viewport widths per second. */
  x: number
  y: number
  speed: number
  /** Puff size as a fraction of the viewport's smaller side. */
  scale: number
  puffs: ReadonlyArray<{ dx: number; dy: number; r: number }>
}

export const buildClouds = (count: number, seed: number): Array<SkyCloud> => {
  let s = seed >>> 0
  const next = () => {
    s = (s + 0x9e3779b9) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 16), 0x85ebca6b)
    t = Math.imul(t ^ (t >>> 13), 0xc2b2ae35)
    return ((t ^ (t >>> 16)) >>> 0) / 4294967296
  }
  return Array.from({ length: count }, () => {
    const puffs = 3 + Math.floor(next() * 3)
    return {
      x: next(),
      y: 0.08 + next() * 0.34,
      speed: 0.0015 + next() * 0.002,
      scale: 0.05 + next() * 0.05,
      puffs: Array.from({ length: puffs }, (_, i) => ({
        dx: (i - puffs / 2) * 0.9 + (next() - 0.5) * 0.3,
        dy: (next() - 0.5) * 0.35,
        r: 0.75 + next() * 0.55,
      })),
    }
  })
}

/** Clouds: a shaded under-layer, then the lit top, both flat shapes. */
export const paintClouds = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  clouds: ReadonlyArray<SkyCloud>,
  state: SkyState,
  clock: number
) => {
  const min = Math.min(w, h)
  for (const cloud of clouds) {
    // Wraps a little off both edges, so a cloud never pops in or out mid-screen.
    const x =
      ((((cloud.x + clock * cloud.speed * 0.001) % 1.3) + 1.3) % 1.3) - 0.15
    const baseX = x * w
    const baseY = cloud.y * h
    const size = cloud.scale * min

    ctx.fillStyle = rgba(state.cloudShade, 0.85)
    for (const puff of cloud.puffs) {
      const px = baseX + puff.dx * size
      const py = baseY + puff.dy * size + size * 0.22
      ctx.beginPath()
      ctx.arc(px, py, puff.r * size, 0, TAU)
      ctx.fill()
    }

    ctx.fillStyle = rgba(state.cloud, 0.92)
    for (const puff of cloud.puffs) {
      const px = baseX + puff.dx * size
      const py = baseY + puff.dy * size
      ctx.beginPath()
      ctx.arc(px, py, puff.r * size * 0.92, 0, TAU)
      ctx.fill()
    }
  }
}

/** Keeps a phone's star and cloud counts in proportion. */
export const scaleForMobile = <T extends { mobileScale: number }>(
  count: number,
  config: T,
  mobile: boolean
) =>
  mobile
    ? Math.max(1, Math.round(count * clamp(config.mobileScale, 0.1, 1)))
    : count
