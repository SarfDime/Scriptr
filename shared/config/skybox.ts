import type {
  SkyboxColorOverrides,
  SkyboxConfig,
  SkyColorField,
  SkyColorKey,
  SkyColorPalette,
  SkyPhase,
  SkyPhaseColors,
} from '../types/skybox.types'

// Shared by the sky (shared/utils/skybox-model.ts,
// next/lib/app-background/skybox-canvas.ts) and the Christmas canvas, which lays
// its mountain range on SKY_ANCHORS so the sun
// and the moon rise and set behind the ridge.
//
// The Studio document (sanity/schemas/misc/skybox.ts) edits SKYBOX_DEFAULTS and the
// color picks per theme; the day can also be reviewed with the dev time override
// (?skyTime=HH:MM&skySpeed=1440).

/** Used for every setting that is not set in Sanity. */
export const SKYBOX_DEFAULTS: SkyboxConfig = {
  sunriseHour: 6,
  sunsetHour: 18,
  starCount: 200,
  starSize: 1,
  cloudCount: 3,
  cloudSpeed: 1,
  mobileScale: 0.6,
  timeSpeed: 1,
  sunRadius: 0.09,
  moonRadius: 0.09,
  immersiveEnabled: true,
  immersiveDayMinutes: 5,
  immersiveRampSeconds: 10,
  immersiveFadeMs: 1500,
  immersiveDarkening: 0.38,
  immersiveFlare: true,
}

/**
 * The contract between the sky and the scenery under it, as viewport fractions.
 * `horizon` is where the near mountain range stands: the sky keeps the sun's centre
 * on that line at sunrise and sunset, so the ridge hides its lower half. Constants,
 * so a canvas that paints once still lines up with a sun that moves all day.
 */
export const SKY_ANCHORS = {
  horizon: 0.68,
  sunriseX: 0.18,
  sunsetX: 0.82,
  /** The moon crosses the whole width over 24 h. */
  moonFromX: 0.06,
  moonToX: 0.94,
} as const

/**
 * One keyframe per phase; the day is these keyframes in order, blended by hour, so
 * there is no switch and no visible jump between phases. The colors are exaggerated
 * on purpose, not photorealistic, and each theme picks its own: the dark theme has a
 * deep night and a magenta sunset, the light theme pastel ones so its dark copy stays
 * readable. Each value is a theme color key (see sky-colors.module.css).
 */
export const SKY_COLORS: Record<SkyPhase, SkyPhaseColors> = {
  night: {
    skyTop: 'sky-night-top',
    skyBottom: 'sky-night-bottom',
    sun: 'sky-night-sun',
    sunGlow: 'sky-night-sun-glow',
    moon: 'sky-night-moon',
    cloud: 'sky-night-cloud',
    cloudShade: 'sky-night-cloud-shade',
  },
  dawn: {
    skyTop: 'sky-dawn-top',
    skyBottom: 'sky-dawn-bottom',
    sun: 'sky-dawn-sun',
    sunGlow: 'sky-dawn-sun-glow',
    moon: 'sky-dawn-moon',
    cloud: 'sky-dawn-cloud',
    cloudShade: 'sky-dawn-cloud-shade',
  },
  sunrise: {
    skyTop: 'sky-sunrise-top',
    skyBottom: 'sky-sunrise-bottom',
    sun: 'sky-sunrise-sun',
    sunGlow: 'sky-sunrise-sun-glow',
    moon: 'sky-sunrise-moon',
    cloud: 'sky-sunrise-cloud',
    cloudShade: 'sky-sunrise-cloud-shade',
  },
  morning: {
    skyTop: 'sky-morning-top',
    skyBottom: 'sky-morning-bottom',
    sun: 'sky-morning-sun',
    sunGlow: 'sky-morning-sun-glow',
    moon: 'sky-morning-moon',
    cloud: 'sky-morning-cloud',
    cloudShade: 'sky-morning-cloud-shade',
  },
  noon: {
    skyTop: 'sky-noon-top',
    skyBottom: 'sky-noon-bottom',
    sun: 'sky-noon-sun',
    sunGlow: 'sky-noon-sun-glow',
    moon: 'sky-noon-moon',
    cloud: 'sky-noon-cloud',
    cloudShade: 'sky-noon-cloud-shade',
  },
  afternoon: {
    skyTop: 'sky-afternoon-top',
    skyBottom: 'sky-afternoon-bottom',
    sun: 'sky-afternoon-sun',
    sunGlow: 'sky-afternoon-sun-glow',
    moon: 'sky-afternoon-moon',
    cloud: 'sky-afternoon-cloud',
    cloudShade: 'sky-afternoon-cloud-shade',
  },
  sunset: {
    skyTop: 'sky-sunset-top',
    skyBottom: 'sky-sunset-bottom',
    sun: 'sky-sunset-sun',
    sunGlow: 'sky-sunset-sun-glow',
    moon: 'sky-sunset-moon',
    cloud: 'sky-sunset-cloud',
    cloudShade: 'sky-sunset-cloud-shade',
  },
  dusk: {
    skyTop: 'sky-dusk-top',
    skyBottom: 'sky-dusk-bottom',
    sun: 'sky-dusk-sun',
    sunGlow: 'sky-dusk-sun-glow',
    moon: 'sky-dusk-moon',
    cloud: 'sky-dusk-cloud',
    cloudShade: 'sky-dusk-cloud-shade',
  },
}

/**
 * The phases in day order, so the Studio can build one fieldset per phase and the
 * overrides can be applied without a hand-kept list.
 */
export const SKY_PHASES = [
  'night',
  'dawn',
  'sunrise',
  'morning',
  'noon',
  'afternoon',
  'sunset',
  'dusk',
] as const satisfies ReadonlyArray<SkyPhase>

/** The color keys of one phase, in the order the Studio shows them. */
export const SKY_COLOR_KEYS = [
  'skyTop',
  'skyBottom',
  'sun',
  'sunGlow',
  'moon',
  'cloud',
  'cloudShade',
] as const satisfies ReadonlyArray<SkyColorKey>

/** What each color key paints, shared by the Studio schema. */
export const SKY_COLOR_ROLES: Record<
  SkyColorKey,
  { title: string; description: string }
> = {
  skyTop: { title: 'Sky top', description: 'The color at the top of the sky.' },
  skyBottom: {
    title: 'Sky bottom',
    description: 'The color at the horizon.',
  },
  sun: { title: 'Sun', description: 'The sun disc.' },
  sunGlow: { title: 'Sun glow', description: 'The halo around the sun.' },
  moon: { title: 'Moon', description: 'The moon disc.' },
  cloud: {
    title: 'Clouds',
    description: 'The lit top of the clouds.',
  },
  cloudShade: {
    title: 'Cloud shade',
    description: 'The underside of the clouds.',
  },
}

/** The Studio field name for one phase color, e.g. `noonSkyTop`. */
export const skyColorField = (phase: SkyPhase, key: SkyColorKey) =>
  `${phase}${key.charAt(0).toUpperCase()}${key.slice(1)}` as SkyColorField

/** Theme key for the stars (one color; the twinkle is done with alpha). */
export const SKY_STAR_COLOR = 'sky-star'

/** The built-in palette: the colors of every phase plus the stars. */
export const SKY_PALETTE: SkyColorPalette = {
  ...SKY_COLORS,
  star: SKY_STAR_COLOR,
}

/**
 * The built-in palette with the colors picked in Sanity on top. A picked value is a
 * theme color key, so the sky keeps following the theme.
 */
export const applySkyColorOverrides = (
  palette: SkyColorPalette,
  overrides?: SkyboxColorOverrides | null
): SkyColorPalette => {
  if (!overrides) return palette
  const next: SkyColorPalette = { ...palette }
  for (const phase of SKY_PHASES) {
    next[phase] = { ...palette[phase] }
    for (const key of SKY_COLOR_KEYS) {
      const pick = overrides[skyColorField(phase, key)]
      if (pick) next[phase][key] = pick
    }
  }
  if (overrides.star) next.star = overrides.star
  return next
}

/**
 * The immersive (full-screen) palette: the same keys as SKY_COLORS under a
 * `sky-original-` prefix (`sky-noon-top` -> `sky-original-noon-top`). Those tokens
 * do not change with the theme, because no copy is on screen to stay readable.
 */
export const originalSkyKey = (key: string) =>
  key.replace(/^sky-/, 'sky-original-')

/** `?skyTime=HH:MM` — pin the sky to a time of day, for reviewing the design. */
export const SKY_TIME_PARAM = 'skyTime'
/** `?skySpeed=N` — 1440 sweeps a whole day in a minute. */
export const SKY_SPEED_PARAM = 'skySpeed'
