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

export interface StarCanvasSanityData {
  starCount?: number | null
  starColors?: Array<string> | null
  starMinSize?: number | null
  starMaxSize?: number | null
  starDriftSpeed?: number | null

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
  galaxyDensity?: number | null
  galaxyCoreColor?: string | null
  galaxyArmColor?: string | null
  galaxyAccentColor?: string | null
  galaxyDriftFactor?: number | null
  galaxyDriftDirection?: GalaxyDriftDirection | null
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
  flare: string
  planets: Array<string>
  galaxyCore: string
  galaxyArm: string
  galaxyAccent: string
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
  layer?: number // index into Galaxy.layers (default 0)
}

/**
 * The galaxy is drawn as a few stacked sprites. Layer 0 is the static glow; each
 * other layer holds a share of the stars and brightens and dims on its own, which
 * makes the stars twinkle without animating each one.
 */
export type GalaxyLayer = {
  sprite: HTMLCanvasElement | null
  rate: number // rad/ms
  phase: number
  amount: number // brightness swings between 1 - amount and 1
}

export type Galaxy = {
  dots: Array<GalaxyDot>
  layers: Array<GalaxyLayer>
  width: number // on-screen length in px
  height: number // on-screen height in px
  anchor: Point // screen position as ratios (0-1)
}
