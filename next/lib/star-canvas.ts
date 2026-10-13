import type {
  DriftingPlanet,
  Galaxy,
  GalaxyDot,
  OrbitingPlanet,
  PlanetLook,
  PlanetMark,
  Point,
  StarCanvasColors,
  StarCanvasConfig,
  StarCanvasSanityData,
} from '@shared/types/star-canvas.types'
import { nextLogs } from '@/lib/logger'

export const TAU = Math.PI * 2
export const WHITE = '255, 255, 255'

// Phones (any orientation) and touch-only tablets
export const MOBILE_QUERY =
  '(max-width: 767px), (hover: none) and (pointer: coarse)'

export const SPRITE_SIZE = 128 // planet sprites are drawn at this size, then scaled
export const BODY_RADIUS = 36 // planet body radius inside the sprite (rest is ring space)
export const TEXTURE_PERIOD = 128 // width of the planet surface texture (one full turn)
export const TEXTURE_HEIGHT = 64
export const TEXTURE_VIEW = 64 // the visible half of the planet: window into the texture
const MILKY_WAY_ASPECT = 0.32 // height / width, before the height multiplier
const MILKY_WAY_LENGTH = 4 // the band is this many times the configured size
const MILKY_WAY_SPRITE_MAX_WIDTH = 1600 // bigger galaxies are drawn at lower resolution
const MILKY_WAY_SPRITE_MAX_AREA = 1600 * 560 // keeps the sprites' memory (and repaint cost) low
const DOT_PX = 2 // on-screen px per unit of GalaxyDot size, whatever the galaxy size
const GALAXY_DOTS = 2600 // at density 1
const GALAXY_DOTS_MAX = 20000 // upper limit, so extreme settings can't freeze the page
// Layer 0 (clouds, glow, dust) only holds big soft shapes, so it is painted at this share of
// the resolution and stretched when drawn. Measured against full resolution the picture
// differs by under 0.5 of 255 brightness levels on average, and the layer needs a quarter
// of the memory.
const NEBULA_RESOLUTION = 0.4
// The galaxy is a still picture: its layers are painted separately, then flattened once at
// the average brightness they used to twinkle around (the nebula between 0.9 and 1, each
// group of stars between 0.75 and 1). Stacked like this the bright core saturates softly;
// painting every dot into one buffer instead clips it to flat white.
const NEBULA_BRIGHTNESS = 0.95
const STAR_BRIGHTNESS = 0.875
// Fewer, brighter stars and grain: half the dots to build and paint, for a galaxy that is
// somewhat sparser but keeps its structure (overall brightness within ~6%). Clouds are cheap
// and do not get brighter with a higher alpha (see MIN_DOT_LEVEL), so they all stay.
const STAR_KEEP = 0.5
const STAR_BOOST = 1.25
const GRAIN_KEEP = 0.35
const GRAIN_BOOST = 2
// Dots that add less than one of the 255 brightness levels are dropped. Below half a level
// that changes no pixel; between half and one it slightly thins the faintest nebula
// wisps, which is the trade for painting fewer dots.
const MIN_DOT_LEVEL = 1

export const BLACK_HOLE_PRESETS: Record<string, Point> = {
  center: { x: 0.5, y: 0.48 },
  'top-right': { x: 0.65, y: 0.35 },
  'bottom-right': { x: 0.62, y: 0.62 },
}

const DIAGONAL = Math.SQRT1_2

/** Unit vectors for the galaxy's drift direction (screen y grows downward). */
export const GALAXY_DRIFT_DIRECTIONS: Record<string, Point> = {
  'up-left': { x: -DIAGONAL, y: -DIAGONAL },
  up: { x: 0, y: -1 },
  'up-right': { x: DIAGONAL, y: -DIAGONAL },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  'down-left': { x: -DIAGONAL, y: DIAGONAL },
  down: { x: 0, y: 1 },
  'down-right': { x: DIAGONAL, y: DIAGONAL },
}

const GALAXY_ANCHORS: Record<string, Point> = {
  center: { x: 0.5, y: 0.5 },
  'top-left': { x: 0.2, y: 0.22 },
  'top-right': { x: 0.8, y: 0.22 },
  'bottom-left': { x: 0.2, y: 0.78 },
  'bottom-right': { x: 0.8, y: 0.78 },
  left: { x: 0.15, y: 0.5 },
  right: { x: 0.85, y: 0.5 },
}

// Multiplied by the config's `mobileScale` on mobile
const MOBILE_SCALED_KEYS = [
  'starCount',
  'starMinSize',
  'starMaxSize',
  'starDriftSpeed',
  'shootingStarChance',
  'blackHoleRadius',
  'blackHoleGlowRadius',
  'blackHoleGravityRadius',
  'blackHoleGravityForce',
  'blackHoleSmokeWisps',
  'blackHoleSmokeIntensity',
  'blackHoleSmokeSpeed',
  'blackHoleEdgeRipple',
  'planetCount',
  'planetMinSize',
  'planetMaxSize',
  'planetSpeed',
  'freePlanetCount',
  'freePlanetDriftSpeed',
  'galaxyMinSize',
  'galaxyMaxSize',
  'galaxyOpacity',
  'galaxyDensity',
] as const

const DEFAULTS: StarCanvasConfig = {
  starCount: 200,
  starColors: ['background-50', 'sky', 'brand-300', 'lavender', 'grey-300'],
  starMinSize: 0.4,
  starMaxSize: 1.3,
  starDriftSpeed: 0.012,

  backgroundHazeColor: 'grey-800',
  backgroundHazeOpacity: 0.5,
  backgroundHazeRadius: 0.9,

  shootingStarChance: 0.008,
  shootingStarColor: 'sky',

  enableBlackHole: true,
  blackHolePresetPosition: 'custom',
  blackHoleXRatio: 0.5,
  blackHoleYRatio: 0.48,
  blackHoleRadius: 65,
  blackHoleGlowRadius: 210,
  blackHoleGravityRadius: 360,
  blackHoleGravityForce: 0.35,
  blackHoleHoverReachMultiplier: 1.5,
  blackHoleHoverGravityMultiplier: 2,

  blackHoleSmokeWisps: 7,
  blackHoleSmokeIntensity: 1,
  blackHoleSmokeSpeed: 1,
  blackHoleEdgeRipple: 0.8,
  blackHoleHoverRipple: 3,

  blackHoleCoreColor: 'background-1000',
  blackHolePhotonRingColor: 'sky',
  blackHoleBaseGlowColor: 'brand',
  blackHoleCoronaColor: 'amber',
  blackHoleCoronaWidth: 0.6,
  enableBlackHoleFlare: true,
  blackHoleFlare: 0.7,
  blackHoleFlareSpin: 1,
  blackHoleRingGlow: 1,

  planetColors: ['amber', 'rose-pink', 'sky', 'lavender', 'jade'],
  planetMinSize: 4,
  planetMaxSize: 11,
  planetRingChance: 0.25,
  planetSizeRarity: 3,
  enablePlanets: true,
  planetCount: 4,
  planetOrbitMinRatio: 1.8,
  planetOrbitMaxRatio: 3.5,
  planetOrbitTilt: 0.35,
  planetSpeed: 1,
  planetHoverChaos: 1,
  freePlanetCount: 3,
  freePlanetDriftSpeed: 0.04,

  enableGalaxy: true,
  galaxyPosition: 'bottom-left',
  galaxyXRatio: 0.2,
  galaxyYRatio: 0.78,
  galaxyMinSize: 320,
  galaxyMaxSize: 520,
  galaxyOpacity: 0.7,
  galaxyWidthScale: 1,
  galaxyHeightScale: 1,
  galaxyDensity: 1,
  galaxyCenterDensity: 1,
  galaxyEndDensity: 1,
  galaxyCoreColor: 'amber',
  galaxyArmColor: 'sky',
  galaxyAccentColor: 'lavender',
  galaxyDriftFactor: 0.4,
  galaxyDriftDirection: 'up-left',
  galaxyTilt: 0,

  mobileScale: 0.5,
  mobileEnableBlackHole: true,
  mobileEnableGalaxy: true,
  // 'desktop' = phones use the desktop placement
  mobileBlackHolePresetPosition: 'desktop',
  mobileBlackHoleXRatio: 0.5,
  mobileBlackHoleYRatio: 0.48,
  mobileGalaxyPosition: 'desktop',
  mobileGalaxyXRatio: 0.2,
  mobileGalaxyYRatio: 0.78,
}

/** Sanity returns `null` for unset fields, so `{...DEFAULTS, ...data}` is not enough. */
export const withDefaults = (
  data?: StarCanvasSanityData | null
): StarCanvasConfig => {
  const config: StarCanvasConfig = { ...DEFAULTS }
  for (const [key, value] of Object.entries(data ?? {})) {
    if (value != null && key in config) {
      ;(config as Record<string, unknown>)[key] = value
    }
  }
  if (!config.starColors.length) config.starColors = DEFAULTS.starColors
  if (!config.planetColors.length) config.planetColors = DEFAULTS.planetColors
  return config
}

export const scaleForMobile = (config: StarCanvasConfig): StarCanvasConfig => {
  const scaled: StarCanvasConfig = { ...config }
  for (const key of MOBILE_SCALED_KEYS) {
    scaled[key] = config[key] * config.mobileScale
  }
  scaled.starCount = Math.round(scaled.starCount)
  scaled.planetCount = Math.round(scaled.planetCount)
  scaled.freePlanetCount = Math.round(scaled.freePlanetCount)

  // Either can be switched off on phones (no black hole also means no orbiting planets)
  if (!config.mobileEnableBlackHole) scaled.enableBlackHole = false
  if (!config.mobileEnableGalaxy) scaled.enableGalaxy = false

  // Placement has its own mobile setting; 'desktop' keeps the desktop one
  if (config.mobileBlackHolePresetPosition !== 'desktop') {
    scaled.blackHolePresetPosition = config.mobileBlackHolePresetPosition
    scaled.blackHoleXRatio = config.mobileBlackHoleXRatio
    scaled.blackHoleYRatio = config.mobileBlackHoleYRatio
  }
  if (config.mobileGalaxyPosition !== 'desktop') {
    scaled.galaxyPosition = config.mobileGalaxyPosition
    scaled.galaxyXRatio = config.mobileGalaxyXRatio
    scaled.galaxyYRatio = config.mobileGalaxyYRatio
  }
  return scaled
}

// ── Colors ──────────────────────────────────────────────────────────────────

/**
 * Turns a theme color key ("brand", "sky", "background-50", or any CSS color)
 * into "r, g, b".
 *
 * The browser resolves the color (oklch(), color-mix(), var() chains, ...),
 * then we paint one pixel and read it back, which always yields sRGB bytes.
 * Call this again after a theme change to pick up the new values.
 */
const createColorResolver = () => {
  const sampler = document.createElement('canvas')
  sampler.width = 1
  sampler.height = 1
  const sctx = sampler.getContext('2d', { willReadFrequently: true })
  const themeVars = getComputedStyle(document.body)

  return (key: string): string => {
    if (!sctx) return WHITE

    const probe = document.createElement('span')
    const varName = [`--color-${key}`, `--${key}`].find((name) =>
      themeVars.getPropertyValue(name).trim()
    )
    probe.style.color = varName ? `var(${varName})` : key // else: plain CSS color like "white"

    if (!probe.style.color) {
      nextLogs({
        logLevel: 'warn',
        message: `[StarCanvas] Unknown color "${key}", using white`,
      })
      return WHITE
    }

    document.body.appendChild(probe)
    const css = getComputedStyle(probe).color
    probe.remove()

    sctx.clearRect(0, 0, 1, 1)
    sctx.fillStyle = css
    sctx.fillRect(0, 0, 1, 1)
    const [r, g, b] = sctx.getImageData(0, 0, 1, 1).data
    return `${r}, ${g}, ${b}`
  }
}

export const resolveColors = (config: StarCanvasConfig): StarCanvasColors => {
  const toRGB = createColorResolver()
  return {
    stars: config.starColors.map((key) => `rgb(${toRGB(key)})`),
    meteor: toRGB(config.shootingStarColor),
    glow: toRGB(config.blackHoleBaseGlowColor),
    ring: toRGB(config.blackHolePhotonRingColor),
    core: `rgb(${toRGB(config.blackHoleCoreColor)})`,
    corona: toRGB(config.blackHoleCoronaColor),
    haze: toRGB(config.backgroundHazeColor),
    flare: mixRGB(toRGB(config.blackHolePhotonRingColor), WHITE, 0.65),
    planets: config.planetColors.map((key) => toRGB(key)),
    galaxyCore: toRGB(config.galaxyCoreColor),
    galaxyArm: toRGB(config.galaxyArmColor),
    galaxyAccent: toRGB(config.galaxyAccentColor),
  }
}

// ── Small helpers ───────────────────────────────────────────────────────────

const pick = <T>(items: ReadonlyArray<T>, fallback: T): T =>
  items[Math.floor(Math.random() * items.length)] ?? fallback

/** Roughly bell-shaped random number from -1 to 1. */
const gauss = () => (Math.random() + Math.random() + Math.random()) / 1.5 - 1

const createSprite = (width: number, height = width) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return { canvas, sctx: canvas.getContext('2d') }
}

export const mixRGB = (a: string, b: string, t: number) => {
  const [ar = 0, ag = 0, ab = 0] = a.split(',').map(Number)
  const [br = 0, bg = 0, bb = 0] = b.split(',').map(Number)
  const mix = (from: number, to: number) => Math.round(from + (to - from) * t)
  return `${mix(ar, br)}, ${mix(ag, bg)}, ${mix(ab, bb)}`
}

/**
 * Adds color stops that fade `peak` opacity to 0 along a gradient with a smooth
 * curve whose slope is also 0 at the end, so there is no visible edge where it
 * stops. The color can blend from `from` to `to` on the way out.
 */
export const addFalloff = (
  gradient: CanvasGradient,
  from: string,
  peak: number,
  power = 2.4,
  to = from
) => {
  const steps = 10
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    gradient.addColorStop(
      t,
      `rgba(${mixRGB(from, to, t)}, ${peak * (1 - t) ** power})`
    )
  }
}

// ── Background haze ─────────────────────────────────────────────────────────

const NOISE_MASK = (1 << 20) - 1
const HAZE_DOWNSCALE = 2
let noise: Float32Array | null = null

/**
 * A soft circle of `rgb` in the middle of the screen, `opacity` strong at the center
 * and fading smoothly to nothing. Returns a sprite as big as the screen.
 *
 * A plain canvas gradient only has 256 opacity levels, and on a large, faint area that
 * shows up as visible rings. So the sprite is painted pixel by pixel and every value
 * (opacity and each premultiplied color channel, which is how canvases store pixels)
 * gets a little random noise before it is rounded. Averaged over neighboring pixels
 * the steps blend into a smooth fade.
 */
export const buildHazeSprite = (
  width: number,
  height: number,
  rgb: string,
  opacity: number,
  radiusScale: number
) => {
  // Half the screen's resolution: a fade this soft doesn't need more, and it makes
  // painting 4 times cheaper. The component draws it back up without smoothing, so
  // the noise stays crisp.
  const w = Math.max(1, Math.ceil(width / HAZE_DOWNSCALE))
  const h = Math.max(1, Math.ceil(height / HAZE_DOWNSCALE))
  const { canvas, sctx } = createSprite(w, h)
  if (!sctx) return null

  if (!noise) {
    noise = new Float32Array(NOISE_MASK + 1)
    for (let i = 0; i <= NOISE_MASK; i++) noise[i] = Math.random()
  }
  const random = noise

  const image = sctx.createImageData(w, h)
  const data = image.data
  const [cr = 0, cg = 0, cb = 0] = rgb.split(',').map(Number)
  const radius = Math.max(1, (Math.hypot(w, h) / 2) * radiusScale)

  // Opacity (0-255) by distance from the middle, as a lookup table
  const steps = 1024
  const falloff = new Float32Array(steps + 1)
  for (let i = 0; i <= steps; i++) {
    falloff[i] = opacity * 255 * (1 - i / steps) ** 1.8
  }

  let pixel = 0
  let n = 0

  // Triangular noise of about one level either way: the standard way to dither.
  // Opacity and each color channel draw their own values.
  const triangularNoise = () =>
    (random[n++ & NOISE_MASK] ?? 0) + (random[n++ & NOISE_MASK] ?? 0) - 1

  // One color channel as stored in the pixel data. Canvases store colors
  // premultiplied by opacity, so the value that gets dithered is the premultiplied
  // one: color * opacity, rounded up or down at random, then converted back. It is
  // rounded up on the way back, so that however a browser rounds when it
  // premultiplies again, it lands on the same value.
  const dithered = (color: number, k: number, a: number) => {
    const premultiplied = Math.max(
      0,
      Math.min(a, Math.round(color * k + triangularNoise()))
    )
    return Math.min(255, Math.ceil((premultiplied * 255) / a))
  }

  for (let y = 0; y < h; y++) {
    const dy = y - h / 2
    for (let x = 0; x < w; x++) {
      const dx = x - w / 2
      const t = Math.sqrt(dx * dx + dy * dy) / radius
      if (t < 1) {
        const alpha = falloff[(t * steps) | 0] ?? 0
        const a = Math.max(0, Math.round(alpha + triangularNoise()))
        if (a > 0) {
          const k = alpha / 255
          data[pixel] = dithered(cr, k, a)
          data[pixel + 1] = dithered(cg, k, a)
          data[pixel + 2] = dithered(cb, k, a)
          data[pixel + 3] = a
        }
      }
      pixel += 4
    }
  }
  sctx.putImageData(image, 0, 0)
  return canvas
}

// ── Planets ─────────────────────────────────────────────────────────────────

const PLANET_PATTERNS = ['bands', 'bands', 'spots', 'spots', 'plain'] as const

const shuffle = <T>(items: Array<T>) => {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const a = items[i]
    const b = items[j]
    if (a !== undefined && b !== undefined) {
      items[i] = b
      items[j] = a
    }
  }
  return items
}

/**
 * Deals palette colors like cards: every color is used once before any repeats,
 * so planets never end up mostly the same color.
 */
const createColorDealer = (count: number) => {
  let deck: Array<number> = []
  let last = -1
  return () => {
    if (!deck.length) {
      deck = shuffle(Array.from({ length: count }, (_, i) => i))
      // Don't repeat the color dealt last when a new deck starts
      if (deck.length > 1 && deck[deck.length - 1] === last) {
        const first = deck[0] ?? 0
        deck[0] = last
        deck[deck.length - 1] = first
      }
    }
    last = deck.pop() ?? 0
    return last
  }
}

const makeSpots = (
  count: number,
  size: [number, number],
  alpha: [number, number],
  lightChance: number
): Array<PlanetMark> =>
  Array.from({ length: count }, () => ({
    kind: 'spot',
    x: Math.random(),
    y: 0.15 + Math.random() * 0.7,
    size: size[0] + Math.random() * size[1],
    alpha: alpha[0] + Math.random() * alpha[1],
    light: Math.random() < lightChance,
  }))

// Every pattern includes some spots, since the spin is only visible through features
const makeMarks = (pattern: (typeof PLANET_PATTERNS)[number]) => {
  if (pattern === 'bands') {
    const bands = Array.from(
      { length: 3 + Math.floor(Math.random() * 5) },
      () => ({
        kind: 'band' as const,
        x: 0,
        y: Math.random(),
        size: 0.08 + Math.random() * 0.2,
        alpha: 0.12 + Math.random() * 0.23,
        light: Math.random() < 0.5,
      })
    )
    const storms = makeSpots(
      2 + Math.floor(Math.random() * 2),
      [0.1, 0.1],
      [0.15, 0.12],
      0.5
    )
    return [...bands, ...storms]
  }
  if (pattern === 'spots') {
    return makeSpots(
      6 + Math.floor(Math.random() * 5),
      [0.08, 0.2],
      [0.14, 0.14],
      0.3
    )
  }
  return makeSpots(
    3 + Math.floor(Math.random() * 3),
    [0.2, 0.15],
    [0.06, 0.06],
    0.5
  )
}

/** Random size, color, pattern, ring and spin. Shared by orbiting and drifting planets. */
const makePlanetLook = (
  config: StarCanvasConfig,
  colorIndex: number
): PlanetLook => ({
  // Raising to a power makes big planets rare (rarity 1 = an even mix of sizes)
  radius:
    config.planetMinSize +
    Math.random() ** config.planetSizeRarity *
      Math.max(0, config.planetMaxSize - config.planetMinSize),
  colorIndex,
  tint: (Math.random() - 0.5) * 0.6,
  marks: makeMarks(pick(PLANET_PATTERNS, 'plain')),
  ringTilt:
    Math.random() < config.planetRingChance ? Math.random() - 0.5 : null,
  // One turn every 10 to 45 seconds, either direction
  spinRate:
    ((Math.random() < 0.5 ? -1 : 1) * TEXTURE_PERIOD) /
    (10000 + Math.random() * 35000),
  spinOffset: Math.random() * TEXTURE_PERIOD,
  texture: null,
  ringBack: null,
  ringFront: null,
})

export const makePlanets = (
  config: StarCanvasConfig,
  width: number,
  height: number
): { orbiting: Array<OrbitingPlanet>; drifting: Array<DriftingPlanet> } => {
  const nextColor = createColorDealer(config.planetColors.length)

  const orbitCount =
    config.enableBlackHole && config.enablePlanets
      ? Math.max(0, Math.round(config.planetCount))
      : 0
  const minRatio = config.planetOrbitMinRatio
  const maxRatio = Math.max(minRatio, config.planetOrbitMaxRatio)
  const averageSize = (config.planetMinSize + config.planetMaxSize) / 2

  const orbiting = Array.from({ length: orbitCount }, (_, index) => {
    const look = makePlanetLook(config, nextColor())
    // Spread orbits across the range, with some jitter inside each slot
    const ratio =
      minRatio +
      (maxRatio - minRatio) * ((index + Math.random() * 0.7) / orbitCount)
    return {
      ...look,
      x: 0,
      y: 0,
      ratio,
      angle: Math.random() * TAU,
      // Unique per planet: slower farther out (Kepler-ish), slower when bigger,
      // plus a little individual variation, all scaled by the speed multiplier
      rate:
        0.00025 *
        config.planetSpeed *
        (2 / ratio) ** 1.5 *
        Math.sqrt(averageSize / Math.max(look.radius, 0.1)) *
        (0.85 + Math.random() * 0.3),
      wobblePhase: Math.random() * TAU,
      wobbleRate: 0.0015 + Math.random() * 0.0025,
    }
  })

  const drifting = Array.from(
    { length: Math.max(0, Math.round(config.freePlanetCount)) },
    () => ({
      ...makePlanetLook(config, nextColor()),
      x: Math.random() * width,
      y: Math.random() * height,
      fade: 1,
    })
  )

  return { orbiting, drifting }
}

/** Surface texture: base color, bands and spots, repeated twice so it can scroll. */
const buildPlanetTexture = (planet: PlanetLook, rgb: string) => {
  const width = TEXTURE_PERIOD * 2
  const { canvas, sctx } = createSprite(width, TEXTURE_HEIGHT)
  if (!sctx) return canvas

  sctx.fillStyle = `rgb(${rgb})`
  sctx.fillRect(0, 0, width, TEXTURE_HEIGHT)
  for (const mark of planet.marks) {
    sctx.fillStyle = mark.light
      ? `rgba(255, 255, 255, ${mark.alpha})`
      : `rgba(0, 0, 0, ${mark.alpha})`
    if (mark.kind === 'band') {
      const thickness = mark.size * TEXTURE_HEIGHT
      sctx.fillRect(
        0,
        mark.y * TEXTURE_HEIGHT - thickness / 2,
        width,
        thickness
      )
      continue
    }
    // Repeat each spot every TEXTURE_PERIOD so the texture wraps without a seam
    for (let copy = -1; copy <= 2; copy++) {
      sctx.beginPath()
      sctx.arc(
        (mark.x + copy) * TEXTURE_PERIOD,
        mark.y * TEXTURE_HEIGHT,
        mark.size * TEXTURE_HEIGHT,
        0,
        TAU
      )
      sctx.fill()
    }
  }
  return canvas
}

// One half of the ring: the back half is drawn before the body, the front after
const buildRingSprite = (tilt: number, rgb: string, back: boolean) => {
  const { canvas, sctx } = createSprite(SPRITE_SIZE)
  if (!sctx) return canvas
  const c = SPRITE_SIZE / 2
  const rx = BODY_RADIUS * 1.6
  const from = back ? Math.PI : 0
  const to = back ? TAU : Math.PI
  sctx.strokeStyle = `rgba(${rgb}, 0.6)`
  sctx.lineWidth = BODY_RADIUS * 0.16
  sctx.beginPath()
  sctx.ellipse(c, c, rx, rx * 0.28, tilt, from, to)
  sctx.stroke()
  sctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'
  sctx.lineWidth = BODY_RADIUS * 0.05
  sctx.beginPath()
  sctx.ellipse(c, c, rx * 0.86, rx * 0.86 * 0.28, tilt, from, to)
  sctx.stroke()
  return canvas
}

/** Everything a planet is drawn from, without lighting. Rebuilt on theme change. */
export const buildPlanetSprites = (planet: PlanetLook, rgb: string) => {
  const base =
    planet.tint >= 0
      ? mixRGB(rgb, WHITE, planet.tint)
      : mixRGB(rgb, '0, 0, 0', -planet.tint)
  return {
    texture: buildPlanetTexture(planet, base),
    ringBack:
      planet.ringTilt === null
        ? null
        : buildRingSprite(planet.ringTilt, base, true),
    ringFront:
      planet.ringTilt === null
        ? null
        : buildRingSprite(planet.ringTilt, base, false),
  }
}

/**
 * Lighting shared by all planets: the lit side is +x (drawn rotated to face the
 * light), the far side is dark, the edges are slightly darker (which also hides
 * the flatness of the scrolling texture), and the lit rim picks up the glow color.
 */
export const buildShadeSprite = (glowRGB: string) => {
  const { canvas, sctx } = createSprite(SPRITE_SIZE)
  if (!sctx) return canvas
  const c = SPRITE_SIZE / 2
  sctx.beginPath()
  sctx.arc(c, c, BODY_RADIUS, 0, TAU)
  sctx.clip()

  const limb = sctx.createRadialGradient(c, c, 0, c, c, BODY_RADIUS)
  limb.addColorStop(0, 'rgba(0, 0, 0, 0)')
  limb.addColorStop(0.65, 'rgba(0, 0, 0, 0)')
  limb.addColorStop(1, 'rgba(0, 0, 0, 0.4)')
  sctx.fillStyle = limb
  sctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE)

  const dark = sctx.createRadialGradient(
    c + BODY_RADIUS * 0.45,
    c,
    BODY_RADIUS * 0.1,
    c + BODY_RADIUS * 0.45,
    c,
    BODY_RADIUS * 1.5
  )
  dark.addColorStop(0, 'rgba(0, 0, 0, 0)')
  dark.addColorStop(0.55, 'rgba(0, 0, 0, 0.15)')
  dark.addColorStop(1, 'rgba(0, 0, 0, 0.85)')
  sctx.fillStyle = dark
  sctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE)

  const rim = sctx.createRadialGradient(
    c + BODY_RADIUS,
    c,
    0,
    c + BODY_RADIUS,
    c,
    BODY_RADIUS * 1.1
  )
  rim.addColorStop(0, `rgba(${glowRGB}, 0.5)`)
  rim.addColorStop(1, `rgba(${glowRGB}, 0)`)
  sctx.fillStyle = rim
  sctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE)
  return canvas
}

// ── Galaxy ──────────────────────────────────────────────────────────────────

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value))

// Galaxy dot tones (see GalaxyDot)
const WARM = 0
const BLEND = 1
const ACCENT = 2
const COOL = 3
const WHITE_TONE = 4
const STAR_LAYERS = 3 // stars are split into this many groups, painted as separate layers

/**
 * A Milky Way like the night-sky photos: a wavy band of faint colored clouds and
 * thousands of tiny colored stars, with soft dark dust patches. Everything is
 * densest at the bright galactic center, which is pure white, and thins out
 * gradually and without a visible end as it flows away to both sides, fanning out
 * into scattered stars. Dots use x along the band (-1 to 1) and y across it; the
 * dense core covers roughly the middle fifth of the sprite.
 */
const milkyWayDots = (
  baseCount: number,
  centerDensity: number,
  endDensity: number
) => {
  // Two groups of dots: a dense one around the center and a sparser one with long
  // tails. Their densities are set separately; with both at 1 nothing changes.
  const coreWeight = 0.7 * centerDensity
  const tailWeight = 0.3 * endDensity
  const total = coreWeight + tailWeight
  if (total <= 0) return []
  const count = baseCount * total

  const bend = 0.05 + Math.random() * 0.05
  const bendPhase = Math.random() * TAU
  const bendFrequency = 1.4 + Math.random() * 1.2
  const center = (Math.random() - 0.5) * 0.2
  const tonePhase = Math.random() * TAU

  const bulge = (x: number) => Math.exp(-(((x - center) / 0.2) ** 2))
  const middle = (x: number) => Math.sin(x * bendFrequency + bendPhase) * bend
  // 0 at the bright center, 1 at the far ends
  const away = (x: number) => Math.min(1, Math.abs(x - center) / 0.9)
  const thickness = (x: number) => 0.12 + 0.36 * bulge(x)
  // The spread across the band widens with distance, so the far parts fan out
  const fan = (x: number) => thickness(x) * (1 + 1.2 * away(x) ** 1.2)
  // Where a dot sits across the band relative to its middle (-1 above, 1 below)
  const across = (x: number, y: number) =>
    (y - middle(x)) / Math.max(fan(x), 0.05)

  // Distance along the band. Exponential falloff: most dots land near the center and
  // the density drops off smoothly the farther out you go, with a longer, fainter
  // tail on top (30% of dots), so the band seems to flow away.
  const pickX = () => {
    for (let attempt = 0; attempt < 8; attempt++) {
      const reach = Math.random() * total < coreWeight ? 0.2 : 0.5
      const side = Math.random() < 0.5 ? -1 : 1
      const x = center + side * -Math.log(1 - Math.random() * 0.999) * reach
      if (Math.abs(x) <= 1) return x
    }
    return center
  }

  // Warm on one side, cool on the other, with the boundary meandering along the
  // band (not a straight line), and some purple and pink mixed in
  const cloudTone = (x: number, y: number) => {
    const roll = Math.random()
    if (roll < 0.12) return ACCENT
    if (roll < 0.22) return BLEND
    const boundary = 0.5 * Math.sin(x * 3.2 + tonePhase) + gauss() * 0.35
    return across(x, y) < boundary ? WARM : COOL
  }
  const starTone = () => {
    const roll = Math.random()
    if (roll < 0.4) return WHITE_TONE
    if (roll < 0.65) return COOL
    if (roll < 0.85) return WARM
    return ACCENT
  }
  const starLayer = () => 1 + Math.floor(Math.random() * STAR_LAYERS)

  // Thousands of tiny, crisp, colored stars; some drift well outside the band
  // (fewer than before, each a little brighter to make up for it)
  const stars = Array.from(
    { length: Math.round(count * 2.5 * STAR_KEEP) },
    (): GalaxyDot => {
      const x = pickX()
      const spread = Math.random() < 0.3 ? 1.9 : 1
      return {
        x,
        y: middle(x) + gauss() * fan(x) * spread,
        size: 0.9 + Math.random() * 1.4,
        alpha: Math.min(
          1,
          (0.4 + Math.random() * 0.6) * (1 - 0.55 * away(x)) * STAR_BOOST
        ),
        tone: starTone(),
        layer: starLayer(),
      }
    }
  )

  // A handful of brighter stars
  const bright = Array.from({ length: 14 }, (): GalaxyDot => {
    const x = clamp(center + gauss() * 0.35, -0.9, 0.9)
    return {
      x,
      y: middle(x) + gauss() * 0.3,
      size: 4 + Math.random() * 3,
      alpha: 0.85,
      tone: Math.random() < 0.6 ? WHITE_TONE : COOL,
      layer: starLayer(),
    }
  })

  // Fine grain: faint, unresolved stars
  const grain = Array.from(
    { length: Math.round(count * 0.5 * GRAIN_KEEP) },
    (): GalaxyDot => {
      const x = pickX()
      const y = middle(x) + gauss() * fan(x)
      return {
        x,
        y,
        size: 3 + Math.random() * 4,
        alpha:
          (0.025 + Math.random() * 0.05) * (1 - 0.6 * away(x)) * GRAIN_BOOST,
        tone: cloudTone(x, y),
      }
    }
  )

  // The colored clouds: big, faint and lumpy, and bigger and fainter the farther out
  const clouds = Array.from(
    { length: Math.round(count / 6) },
    (): GalaxyDot => {
      const x = pickX()
      const y = middle(x) + gauss() * fan(x) * 1.2
      return {
        x,
        y,
        size: (40 + Math.random() * 70) * (1 + away(x)),
        alpha: (0.006 + Math.random() * 0.014) * (1 - 0.7 * away(x)),
        tone: cloudTone(x, y),
      }
    }
  )

  // The galactic center: a warm aura stretched along the band, with a pure white core
  const centerY = middle(center)
  const glow: Array<GalaxyDot> = [
    ...Array.from({ length: 9 }, (_, i): GalaxyDot => {
      const x = center + (i - 4) * 0.05
      return {
        x,
        y: middle(x),
        size: 70 + 40 * bulge(x),
        alpha: 0.012 + 0.03 * bulge(x),
        tone: WARM,
      }
    }),
    { x: center, y: centerY, size: 200, alpha: 0.05, tone: WHITE_TONE },
    { x: center, y: centerY, size: 110, alpha: 0.09, tone: WHITE_TONE },
    { x: center, y: centerY, size: 45, alpha: 0.16, tone: WHITE_TONE },
  ]

  // Dust: a few soft, scattered dark patches (no lane, so nothing forms a line)
  const dust = Array.from({ length: Math.round(count / 60) }, (): GalaxyDot => {
    const x = pickX()
    return {
      x,
      y: middle(x) + gauss() * thickness(x) * 1.1,
      size: 20 + Math.random() * 25,
      alpha: 0.04 + Math.random() * 0.05,
      tone: WARM,
      dark: true,
    }
  })

  // Drops the faintest dots (see MIN_DOT_LEVEL)
  return [...clouds, ...grain, ...glow, ...stars, ...bright, ...dust].filter(
    (dot) => dot.alpha * 255 >= MIN_DOT_LEVEL
  )
}

/** "General location": a preset area with a little randomness, or exact when custom. */
const pickGalaxyAnchor = (config: StarCanvasConfig): Point => {
  if (config.galaxyPosition === 'custom') {
    return { x: config.galaxyXRatio, y: config.galaxyYRatio }
  }
  const base = GALAXY_ANCHORS[config.galaxyPosition]
  if (!base) {
    // 'random': anywhere, but not hugging the edges
    return { x: 0.15 + Math.random() * 0.7, y: 0.15 + Math.random() * 0.7 }
  }
  return {
    x: base.x + (Math.random() - 0.5) * 0.1,
    y: base.y + (Math.random() - 0.5) * 0.1,
  }
}

/**
 * A randomly generated Milky Way band, always horizontal so it reads as part of
 * the background: its bend, bright center position and star pattern differ on
 * every page load.
 */
export const makeGalaxy = (config: StarCanvasConfig): Galaxy | null => {
  if (!config.enableGalaxy) return null

  const count = clamp(
    Math.round(GALAXY_DOTS * config.galaxyDensity),
    0,
    GALAXY_DOTS_MAX
  )
  const minSize = config.galaxyMinSize
  const size =
    minSize + Math.random() * Math.max(0, config.galaxyMaxSize - minSize)
  const width = size * MILKY_WAY_LENGTH * config.galaxyWidthScale
  const height =
    size * MILKY_WAY_LENGTH * MILKY_WAY_ASPECT * config.galaxyHeightScale
  // Draw the sprite 1:1 with the screen unless that would be huge
  const spriteScale = Math.min(
    1,
    MILKY_WAY_SPRITE_MAX_WIDTH / Math.max(width, 1),
    Math.sqrt(MILKY_WAY_SPRITE_MAX_AREA / Math.max(width * height, 1))
  )

  return {
    dots: milkyWayDots(
      count,
      config.galaxyCenterDensity,
      config.galaxyEndDensity
    ),
    sprite: null,
    width,
    height,
    spriteScale,
    anchor: pickGalaxyAnchor(config),
  }
}

export const buildSoftDot = (rgb: string) => {
  const { canvas, sctx } = createSprite(32)
  if (!sctx) return canvas
  const gradient = sctx.createRadialGradient(16, 16, 0, 16, 16, 16)
  gradient.addColorStop(0, `rgba(${rgb}, 1)`)
  gradient.addColorStop(0.4, `rgba(${rgb}, 0.4)`)
  gradient.addColorStop(1, `rgba(${rgb}, 0)`)
  sctx.fillStyle = gradient
  sctx.fillRect(0, 0, 32, 32)
  return canvas
}

// Keeps only what a soft mask lets through, so the sprite fades out toward all
// four edges and blends into the background
const fadeEdges = (
  sctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  sctx.globalAlpha = 1
  sctx.globalCompositeOperation = 'destination-in'

  const along = sctx.createLinearGradient(0, 0, width, 0)
  along.addColorStop(0, 'rgba(0, 0, 0, 0)')
  along.addColorStop(0.06, 'rgba(0, 0, 0, 0.3)')
  along.addColorStop(0.2, 'rgba(0, 0, 0, 1)')
  along.addColorStop(0.8, 'rgba(0, 0, 0, 1)')
  along.addColorStop(0.94, 'rgba(0, 0, 0, 0.3)')
  along.addColorStop(1, 'rgba(0, 0, 0, 0)')
  sctx.fillStyle = along
  sctx.fillRect(0, 0, width, height)

  const across = sctx.createLinearGradient(0, 0, 0, height)
  across.addColorStop(0, 'rgba(0, 0, 0, 0)')
  across.addColorStop(0.08, 'rgba(0, 0, 0, 0.4)')
  across.addColorStop(0.22, 'rgba(0, 0, 0, 1)')
  across.addColorStop(0.78, 'rgba(0, 0, 0, 1)')
  across.addColorStop(0.92, 'rgba(0, 0, 0, 0.4)')
  across.addColorStop(1, 'rgba(0, 0, 0, 0)')
  sctx.fillStyle = across
  sctx.fillRect(0, 0, width, height)
}

/**
 * Paints the galaxy into one still sprite, in layers (the nebula, then the stars in a few
 * groups) that are flattened at their average brightness (see NEBULA_BRIGHTNESS).
 * Rebuilt on theme change.
 */
export const buildGalaxySprites = (
  galaxy: Galaxy,
  colors: StarCanvasColors
) => {
  const { galaxyCore: warm, galaxyAccent: accent, galaxyArm: cool } = colors
  const softDots = [
    buildSoftDot(warm),
    buildSoftDot(mixRGB(warm, accent, 0.5)),
    buildSoftDot(accent),
    buildSoftDot(cool),
    buildSoftDot(WHITE), // the middle of the galaxy is always pure white
  ]
  const dust = buildSoftDot('0, 0, 0')

  const layers: Array<HTMLCanvasElement> = []
  for (let index = 0; index <= STAR_LAYERS; index++) {
    // Layer 0 is painted smaller (see NEBULA_RESOLUTION). The galaxy is always drawn at
    // its full on-screen size, so nothing else needs to know.
    const resolution = index === 0 ? NEBULA_RESOLUTION : 1
    const spriteScale = galaxy.spriteScale * resolution
    const width = Math.max(1, Math.round(galaxy.width * spriteScale))
    const height = Math.max(1, Math.round(galaxy.height * spriteScale))
    const scale = DOT_PX * spriteScale // dots keep their on-screen size
    const rx = (width / 2) * 0.92
    const ry = (height / 2) * 0.92

    const { canvas, sctx } = createSprite(width, height)
    if (!sctx) return

    const paint = (dot: GalaxyDot, sprite: HTMLCanvasElement) => {
      const size = dot.size * scale
      sctx.globalAlpha = dot.alpha
      sctx.drawImage(
        sprite,
        width / 2 + dot.x * rx - size / 2,
        height / 2 + dot.y * ry - size / 2,
        size,
        size
      )
    }

    // Light adds up; dust (drawn after, on every layer) erases some of it
    sctx.globalCompositeOperation = 'lighter'
    for (const dot of galaxy.dots) {
      const sprite = softDots[dot.tone]
      if (sprite && !dot.dark && (dot.layer ?? 0) === index) paint(dot, sprite)
    }
    sctx.globalCompositeOperation = 'destination-out'
    for (const dot of galaxy.dots) {
      if (dot.dark) paint(dot, dust)
    }
    fadeEdges(sctx, width, height)
    layers.push(canvas)
  }

  const width = Math.max(1, Math.round(galaxy.width * galaxy.spriteScale))
  const height = Math.max(1, Math.round(galaxy.height * galaxy.spriteScale))
  const { canvas, sctx } = createSprite(width, height)
  if (!sctx) return
  layers.forEach((layer, index) => {
    sctx.globalAlpha = index === 0 ? NEBULA_BRIGHTNESS : STAR_BRIGHTNESS
    sctx.drawImage(layer, 0, 0, width, height)
  })
  galaxy.sprite = canvas
}
