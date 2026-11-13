import type { SkyboxConfig, SkyKeyframe, SkyPhase } from '../types/skybox.types'

// Shared by the sky (shared/utils/skybox-model.ts,
// next/lib/app-background/skybox-canvas.ts) and the Christmas canvas, which lays
// its mountain range on SKY_ANCHORS so the sun
// and the moon rise and set behind the ridge.
//
// TODO(sanity): a `skybox` document should edit SKYBOX_DEFAULTS and the color picks
// per theme, exactly like `christmasCanvas` does today. Until then the design is
// reviewed with the dev time override (?skyTime=HH:MM&skySpeed=1440).

/** Used for every setting that is not set in Sanity. */
export const SKYBOX_DEFAULTS: SkyboxConfig = {
  sunriseHour: 6,
  sunsetHour: 18,
  starCount: 200,
  cloudCount: 3,
  mobileScale: 0.6,
  timeSpeed: 1,
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
export const SKY_COLORS: Record<
  SkyPhase,
  Omit<SkyKeyframe, 'hour' | 'phase'>
> = {
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

/** Theme key for the stars (one color; the twinkle is done with alpha). */
export const SKY_STAR_COLOR = 'sky-star'

/** `?skyTime=HH:MM` — pin the sky to a time of day, for reviewing the design. */
export const SKY_TIME_PARAM = 'skyTime'
/** `?skySpeed=N` — 1440 sweeps a whole day in a minute. */
export const SKY_SPEED_PARAM = 'skySpeed'
