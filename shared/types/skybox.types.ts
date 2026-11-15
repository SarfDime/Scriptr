// Types for the shared sky (next/components/ui/app-background/SkyboxCanvas.tsx,
// next/lib/app-background/skybox-canvas.ts) and the pure day model that drives it
// (shared/utils/skybox-model.ts).
//
// The model works in viewport fractions (0-1), so the same numbers fit any screen:
// each canvas multiplies them by its own width and height.

/** One point of the day. Neighbouring phases blend into each other. */
export type SkyPhase =
  | 'night'
  | 'dawn'
  | 'sunrise'
  | 'morning'
  | 'noon'
  | 'afternoon'
  | 'sunset'
  | 'dusk'

/** Tunables for the sky. Defaults live in SKYBOX_DEFAULTS (shared/config/skybox.ts). */
export type SkyboxConfig = {
  /** Hour the sun rises (local time, 0-24). */
  sunriseHour: number
  /** Hour the sun sets. */
  sunsetHour: number
  /** Stars at full night, before mobile scaling. */
  starCount: number
  /** Clouds on screen, before mobile scaling. */
  cloudCount: number
  /** Multiplies the counts on phones. */
  mobileScale: number
  /** 1 = real time; 1440 sweeps a whole day in a minute (design review). */
  timeSpeed: number
}

/**
 * One point of the day. Colors are theme color keys, resolved through the theme
 * resolver (never hardcoded), so the light and the dark theme can pick their own.
 */
export type SkyKeyframe = {
  hour: number
  phase: SkyPhase
  skyTop: string
  skyBottom: string
  sun: string
  sunGlow: string
  moon: string
  cloud: string
  cloudShade: string
}

/** The sun on the sky. `color` and `glow` are "r, g, b" strings. */
export type SkySun = {
  x: number
  y: number
  /** Fraction of the viewport's smaller side. */
  radius: number
  visible: boolean
  /** 0 on and below the horizon, 1 once the sun is clear of it; smooth between. */
  visibility: number
  /** How high the sun is: 0 on the horizon, 1 at its highest (noon). */
  elevation: number
  color: string
  glow: string
}

export type SkyMoon = {
  x: number
  y: number
  radius: number
  opacity: number
  color: string
}

/**
 * The live sky. Positions are viewport fractions and `radius` is a fraction of the
 * viewport's smaller side; every color is already resolved to "r, g, b".
 */
export type SkyState = {
  phase: SkyPhase
  /** Local time the state was computed for, in hours (0-24). */
  hours: number
  /** 0 at night, 1 in full daylight. */
  daylight: number
  sun: SkySun
  moon: SkyMoon
  /** 0 = no stars, 1 = the full field. */
  starVisibility: number
  skyTop: string
  skyBottom: string
  star: string
  cloud: string
  cloudShade: string
}

/** A fixed point the other canvases lay their scenery out around. */
export type SkyAnchor = { x: number; y: number }
