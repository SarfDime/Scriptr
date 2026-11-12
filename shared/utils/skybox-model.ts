import {
  SKY_ANCHORS,
  SKY_COLORS,
  SKY_STAR_COLOR,
  SKYBOX_DEFAULTS,
} from '../config/skybox'
import type {
  SkyboxConfig,
  SkyKeyframe,
  SkyPhase,
  SkyState,
} from '../types/skybox.types'

// The day as a pure function: an hour in, the sky out. No DOM, no canvas, no React,
// so it is cheap enough to call every frame and easy to test
// (skybox-model.test.ts runs with `tsx --test`).
//
// The day is a list of keyframes (SKY_COLORS, one per phase) placed on the clock,
// and an hour between two of them is a blend of the two. That is what keeps the
// phases continuous: there is no moment where the sky switches.

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Smoothstep: 0 below `edge0`, 1 above `edge1`, an s-curve in between. */
const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

/** Mixes two "r, g, b" strings, the same way the scenery palette does. */
const mixRGB = (a: string, b: string, t: number) => {
  const [ar = 0, ag = 0, ab = 0] = a.split(',').map(Number)
  const [br = 0, bg = 0, bb = 0] = b.split(',').map(Number)
  const mix = (from: number, to: number) => Math.round(from + (to - from) * t)
  return `${mix(ar, br)}, ${mix(ag, bg)}, ${mix(ab, bb)}`
}

/**
 * Places the keyframes on the clock from the configured sunrise and sunset, so a
 * Sanity setting moves the whole day with it. Sorted, and one keyframe per hour: if
 * two phases would land on the same hour (a very late sunrise), the earlier wins.
 */
export const buildSkyKeyframes = (config: SkyboxConfig): Array<SkyKeyframe> => {
  const rise = config.sunriseHour
  const set = config.sunsetHour
  const placed: Array<{ hour: number; phase: SkyPhase }> = [
    { hour: 0, phase: 'night' },
    { hour: rise - 1, phase: 'dawn' },
    { hour: rise, phase: 'sunrise' },
    { hour: rise + 3, phase: 'morning' },
    { hour: 12, phase: 'noon' },
    { hour: set - 3, phase: 'afternoon' },
    { hour: set, phase: 'sunset' },
    { hour: set + 1.5, phase: 'dusk' },
    { hour: 24, phase: 'night' },
  ]

  const seen = new Set<number>()
  const frames: Array<SkyKeyframe> = []
  for (const { hour, phase } of placed.sort((a, b) => a.hour - b.hour)) {
    if (seen.has(hour) || hour < 0 || hour > 24) continue
    seen.add(hour)
    frames.push({ hour, phase, ...SKY_COLORS[phase] })
  }
  return frames
}

/** The two keyframes around `hours`, and how far between them the clock is. */
const around = (frames: Array<SkyKeyframe>, hours: number) => {
  const first = frames[0] as SkyKeyframe
  for (let i = 0; i < frames.length - 1; i++) {
    const from = frames[i] as SkyKeyframe
    const to = frames[i + 1] as SkyKeyframe
    if (hours >= from.hour && hours <= to.hour) {
      const span = to.hour - from.hour || 1
      return { from, to, t: (hours - from.hour) / span }
    }
  }
  return { from: first, to: first, t: 0 }
}

/** How high the sun is: 0 on the horizon, 1 at its highest, negative below it. */
export const sunElevation = (hours: number, config: SkyboxConfig) => {
  const span = Math.max(0.5, config.sunsetHour - config.sunriseHour)
  const u = (hours - config.sunriseHour) / span
  return Math.sin(u * Math.PI)
}

/** The moon runs half a day behind the sun, so it is up all night. */
export const moonHours = (hours: number) => (hours + 12) % 24

/**
 * The sky at `hours` (local time, 0-24). `toRGB` resolves a theme color key to an
 * "r, g, b" string — the canvas passes the theme resolver, the tests a stub — which
 * keeps this file free of the DOM while still blending real colors smoothly.
 */
export const getSkyState = (
  hours: number,
  config: SkyboxConfig = SKYBOX_DEFAULTS,
  toRGB: (key: string) => string = () => '128, 128, 128'
): SkyState => {
  const time = ((hours % 24) + 24) % 24
  const frames = buildSkyKeyframes(config)
  const { from, to, t } = around(frames, time)

  // Smoothstep on the blend, so the slope is 0 at a keyframe and the sky never
  // changes direction with a visible kink.
  const w = smoothstep(0, 1, t)
  const colour = (key: keyof SkyKeyframe) =>
    mixRGB(toRGB(from[key] as string), toRGB(to[key] as string), w)

  const phase = t < 0.5 ? from.phase : to.phase

  const span = Math.max(0.5, config.sunsetHour - config.sunriseHour)
  const u = (time - config.sunriseHour) / span
  const elevation = Math.sin(u * Math.PI)
  const day = clamp(elevation, 0, 1)
  const daylight = smoothstep(-0.05, 0.35, elevation)

  // Sun: an arc from the sunrise x to the sunset x, its centre on the horizon at
  // both ends. Big, saturated and low near the horizon; smaller and paler at noon
  // (the color comes from the keyframes, which already run orange to pale yellow).
  const sunX = lerp(SKY_ANCHORS.sunriseX, SKY_ANCHORS.sunsetX, clamp(u, 0, 1))
  const sunY = SKY_ANCHORS.horizon - day * (SKY_ANCHORS.horizon - 0.1)

  // Moon: half a day behind on its own arc, crossing the whole width in 24 h. It
  // sits on the horizon at midday (the wrap-around, nearly invisible), climbs all
  // evening and is big and bright at night.
  const moonTime = moonHours(time)
  const moonElevation = sunElevation(moonTime, config)
  const moonU = moonTime / 24
  const moonX = lerp(SKY_ANCHORS.moonFromX, SKY_ANCHORS.moonToX, moonU)
  const moonY =
    SKY_ANCHORS.horizon -
    clamp(moonElevation, 0, 1) * (SKY_ANCHORS.horizon - 0.12)

  return {
    phase,
    hours: time,
    daylight,
    sun: {
      x: sunX,
      y: sunY,
      radius: 0.09 - 0.028 * day,
      visible: elevation >= 0,
      color: colour('sun'),
      glow: colour('sunGlow'),
    },
    moon: {
      x: moonX,
      y: moonY,
      radius: 0.06 + 0.03 * (1 - daylight),
      opacity: 0.08 + 0.92 * (1 - daylight),
      color: colour('moon'),
    },
    starVisibility: 1 - smoothstep(-0.2, 0.1, elevation),
    skyTop: colour('skyTop'),
    skyBottom: colour('skyBottom'),
    star: toRGB(SKY_STAR_COLOR),
    cloud: colour('cloud'),
    cloudShade: colour('cloudShade'),
  }
}
