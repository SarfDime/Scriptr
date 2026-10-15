// Types for the StarCanvas background (next/components/ui/StarCanvas.tsx and
// next/lib/star-canvas.ts). StarCanvasSanityData mirrors the `starCanvas` schema
// (sanity/schemas/misc/star-canvas.ts). Sanity returns null for unset fields.

export type Point = { x: number; y: number }

export type BlackHolePosition =
  | 'center'
  | 'top-right'
  | 'bottom-right'
  | 'custom'

export type GalaxyPosition =
  | 'random'
  | 'center'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'left'
  | 'right'
  | 'custom'

export type GalaxyDriftDirection =
  | 'up-left'
  | 'up'
  | 'up-right'
  | 'left'
  | 'right'
  | 'down-left'
  | 'down'
  | 'down-right'

/** 'desktop' = phones use the desktop placement. */
export type MobileBlackHolePosition = BlackHolePosition | 'desktop'
export type MobileGalaxyPosition = GalaxyPosition | 'desktop'

export type AuroraPosition = 'top' | 'middle' | 'bottom' | 'custom'
export type MobileAuroraPosition = AuroraPosition | 'desktop'

export interface StarCanvasSanityData {
  starCount?: number | null
  starColors?: Array<string> | null
  starMinSize?: number | null
  starMaxSize?: number | null
  starDriftSpeed?: number | null

  backgroundHazeColor?: string | null
  /** Unset counts as on. When false the haze is not drawn at all. */
  enableBackgroundHaze?: boolean | null
  backgroundHazeOpacity?: number | null
  backgroundHazeRadius?: number | null

  shootingStarChance?: number | null
  shootingStarColor?: string | null

  enableBlackHole?: boolean | null
  blackHolePresetPosition?: BlackHolePosition | null
  blackHoleXRatio?: number | null
  blackHoleYRatio?: number | null
  blackHoleRadius?: number | null
  blackHoleGlowRadius?: number | null
  blackHoleGravityRadius?: number | null
  blackHoleGravityForce?: number | null
  blackHoleHoverReachMultiplier?: number | null
  blackHoleHoverGravityMultiplier?: number | null

  blackHoleSmokeWisps?: number | null
  blackHoleSmokeIntensity?: number | null
  blackHoleSmokeSpeed?: number | null
  blackHoleEdgeRipple?: number | null
  blackHoleHoverRipple?: number | null

  blackHoleCoreColor?: string | null
  blackHolePhotonRingColor?: string | null
  blackHoleBaseGlowColor?: string | null
  blackHoleCoronaColor?: string | null
  blackHoleCoronaWidth?: number | null
  enableBlackHoleFlare?: boolean | null
  blackHoleFlare?: number | null
  blackHoleFlareSpin?: number | null
  blackHoleRingGlow?: number | null

  // Planets (shared look)
  planetColors?: Array<string> | null
  planetMinSize?: number | null
  planetMaxSize?: number | null
  planetRingChance?: number | null
  planetSizeRarity?: number | null
  // Planets orbiting the black hole
  enablePlanets?: boolean | null
  planetCount?: number | null
  planetOrbitMinRatio?: number | null
  planetOrbitMaxRatio?: number | null
  planetOrbitTilt?: number | null
  planetSpeed?: number | null
  planetHoverChaos?: number | null
  // Planets drifting freely across the screen
  freePlanetCount?: number | null
  freePlanetDriftSpeed?: number | null

  // Galaxy
  enableGalaxy?: boolean | null
  galaxyPosition?: GalaxyPosition | null
  galaxyXRatio?: number | null
  galaxyYRatio?: number | null
  galaxyMinSize?: number | null
  galaxyMaxSize?: number | null
  galaxyOpacity?: number | null
  galaxyWidthScale?: number | null
  galaxyHeightScale?: number | null
  galaxyDensity?: number | null
  galaxyCenterDensity?: number | null
  galaxyEndDensity?: number | null
  galaxyCoreColor?: string | null
  galaxyArmColor?: string | null
  galaxyAccentColor?: string | null
  galaxyDriftFactor?: number | null
  galaxyDriftDirection?: GalaxyDriftDirection | null
  galaxyTilt?: number | null

  // Aurora
  enableAurora?: boolean | null
  auroraColors?: Array<string> | null
  auroraPosition?: AuroraPosition | null
  auroraYRatio?: number | null
  auroraHeight?: number | null
  auroraIntensity?: number | null
  auroraCurtains?: number | null
  auroraSpeed?: number | null
  auroraWaviness?: number | null

  // Mobile (phones and touch tablets)
  mobileScale?: number | null
  mobileEnableBlackHole?: boolean | null
  mobileEnableGalaxy?: boolean | null
  mobileBlackHolePresetPosition?: MobileBlackHolePosition | null
  mobileBlackHoleXRatio?: number | null
  mobileBlackHoleYRatio?: number | null
  mobileGalaxyPosition?: MobileGalaxyPosition | null
  mobileGalaxyXRatio?: number | null
  mobileGalaxyYRatio?: number | null
  mobileEnableAurora?: boolean | null
  mobileAuroraPosition?: MobileAuroraPosition | null
  mobileAuroraYRatio?: number | null
}

/** StarCanvasSanityData with every field present (defaults applied, nulls removed). */
export type StarCanvasConfig = Required<{
  [K in keyof StarCanvasSanityData]: NonNullable<StarCanvasSanityData[K]>
}>

/** Theme colors resolved to "r, g, b" (or "rgb(r, g, b)" where noted). */
export type StarCanvasColors = {
  stars: Array<string> // "rgb(r, g, b)"
  meteor: string
  glow: string
  ring: string
  core: string // "rgb(r, g, b)"
  corona: string
  haze: string
  flare: string
  planets: Array<string>
  galaxyCore: string
  galaxyArm: string
  galaxyAccent: string
  aurora: Array<string>
}

export type Star = Point & {
  size: number
  colorIndex: number // index into the resolved star palette
  twinkle: number
  phase: number
  fade: number // 0 -> 1 fade-in after a respawn
}

export type Meteor = Point & { length: number; speed: number; alpha: number }

// Features painted on the planet's surface texture, as fractions of its height:
// a band (y = position, size = thickness) or a spot (x/y = position, size = radius)
export type PlanetMark = {
  kind: 'band' | 'spot'
  x: number
  y: number
  size: number
  alpha: number
  light: boolean
}

export type PlanetLook = {
  radius: number
  colorIndex: number // index into the resolved planet palette
  tint: number // -0.3 (darker) to 0.3 (lighter), so repeated colors still differ
  marks: Array<PlanetMark>
  ringTilt: number | null // null = no ring
  spinRate: number // texture px per ms (negative = the other way)
  spinOffset: number // current scroll position in the surface texture
  texture: HTMLCanvasElement | null // surface, scrolled to show the spin
  ringBack: HTMLCanvasElement | null // far half of the ring (behind the body)
  ringFront: HTMLCanvasElement | null // near half (in front of the body)
}

/** x/y: current offset from the black hole center. */
export type OrbitingPlanet = Point &
  PlanetLook & {
    ratio: number // orbit distance, in hole radii
    angle: number // current position on the orbit (rad)
    rate: number // rad/ms, unique per planet (depends on distance and size)
    wobblePhase: number // each planet gets its own rhythm for the hover chaos
    wobbleRate: number
  }

/** x/y: screen position. */
export type DriftingPlanet = Point & PlanetLook & { fade: number }

/** One soft dot of a galaxy, in sprite space (x/y from -1 to 1). */
export type GalaxyDot = {
  x: number
  y: number
  size: number // px in the galaxy sprite
  alpha: number
  tone: number // 0 = warm, 1 = warm/accent mix, 2 = accent, 3 = cool, 4 = pure white
  dark?: boolean // dust: erases light instead of adding it
  layer?: number // which group it is painted in while building (0 = nebula, the default)
}

export type Galaxy = {
  dots: Array<GalaxyDot>
  sprite: HTMLCanvasElement | null // painted in layers, then flattened into this one
  width: number // on-screen length in px
  height: number // on-screen height in px
  spriteScale: number // sprite px per screen px (below 1 for very large galaxies)
  anchor: Point // screen position as ratios (0-1)
}

/**
 * One curtain of the aurora. Its shape is generated once and painted into a canvas of its
 * own; after that it is only moved by CSS animations (sway, breathing, fading).
 */
export type AuroraCurtain = {
  weight: number // 0.7-1: how bright this curtain is next to the others
  baseline: number // 0.24-0.34: where the bright edge sits in the canvas (top to bottom)
  rise: number // 0.8-1: how much of the space above the edge its tallest rays use
  drop: number // 0.75-1: how far its glow reaches down from the edge
  hueShift: number // moves the colors along the curtain, so curtains differ
  waveFreqA: number // the bright edge is two sine waves added together
  wavePhaseA: number
  waveFreqB: number
  wavePhaseB: number
  veilFreq: number // a broad glow that is brighter in some places than others
  veilPhase: number
  rayFreqA: number // soft rays: three sine waves added together
  rayPhaseA: number
  rayFreqB: number
  rayPhaseB: number
  rayFreqC: number
  rayPhaseC: number
  sway: number // sideways travel, as a share of its own width (each way)
  swayMs: number // one trip from one side to the other, at speed 1
  breathe: number // how much it grows and shrinks vertically (0.04 = 4%)
  fadeMs: number // one fade from dim to bright, at speed 1
  phase: number // 0-1: where in its cycles it starts
}
