import { MoonIcon } from '@sanity/icons/Moon'
import { RocketIcon } from '@sanity/icons/Rocket'
import { SparklesIcon } from '@sanity/icons/Sparkles'
import { SunIcon } from '@sanity/icons/Sun'
import {
  SKY_COLOR_KEYS,
  SKY_COLOR_ROLES,
  SKY_PHASES,
  SKYBOX_DEFAULTS,
  skyColorField,
} from '@shared/config/skybox'
import { defineField, defineType } from 'sanity'
import { numberField, THEME_COLORS } from './canvas-fields'

// Settings and colors of the shared sky behind the background canvases
// (next/components/ui/app-background/SkyboxCanvas.tsx).
// Every setting that is left empty falls back to SKYBOX_DEFAULTS, and every color
// that is left empty keeps the built-in color of that phase for the current theme.

const phaseTitle = (phase: string) =>
  `${phase.charAt(0).toUpperCase()}${phase.slice(1)}`

/** One theme's color picks: a fieldset per phase, plus the stars. A named type
 * rather than an object inline in `skybox` because GraphQL cannot express an
 * anonymous object: the extractor needs a top-level type to give the field. */
export const SkyboxColors = defineType({
  name: 'skyboxColors',
  title: 'Skybox colors',
  type: 'object',
  fieldsets: [
    ...SKY_PHASES.map((phase) => ({
      name: phase,
      title: phaseTitle(phase),
      options: { columns: 2 },
    })),
    { name: 'stars', title: 'Stars', options: { columns: 2 } },
  ],
  fields: [
    ...SKY_PHASES.flatMap((phase) =>
      SKY_COLOR_KEYS.map((key) =>
        defineField({
          name: skyColorField(phase, key),
          title: SKY_COLOR_ROLES[key].title,
          description: `${SKY_COLOR_ROLES[key].description} Leave empty for the built-in ${phase} color.`,
          type: 'string',
          fieldset: phase,
          options: { list: THEME_COLORS },
        })
      )
    ),
    defineField({
      name: 'star',
      title: 'Stars',
      description:
        'The stars are one color; the twinkle is done with opacity. Leave empty for the built-in color.',
      type: 'string',
      fieldset: 'stars',
      options: { list: THEME_COLORS },
    }),
  ],
})

const colorsField = (
  name: 'lightColors' | 'darkColors',
  title: string,
  group: string,
  theme: string
) =>
  defineField({
    name,
    title,
    description: `Pick a theme color for any phase of the sky on the ${theme} theme. Phases left empty keep their built-in color.`,
    type: 'skyboxColors',
    group,
    options: { collapsible: false },
  })

export const Skybox = defineType({
  name: 'skybox',
  title: 'Skybox Config',
  type: 'document',
  icon: SunIcon,

  groups: [
    { name: 'day', title: 'Day', icon: SunIcon, default: true },
    { name: 'sky', title: 'Sky', icon: SparklesIcon },
    { name: 'immersive', title: 'Immersive mode', icon: RocketIcon },
    { name: 'lightColors', title: 'Light theme colors', icon: SunIcon },
    { name: 'darkColors', title: 'Dark theme colors', icon: MoonIcon },
  ],

  preview: {
    select: {
      sunriseHour: 'sunriseHour',
      sunsetHour: 'sunsetHour',
    },
    prepare({ sunriseHour, sunsetHour }) {
      const rise = sunriseHour ?? SKYBOX_DEFAULTS.sunriseHour
      const set = sunsetHour ?? SKYBOX_DEFAULTS.sunsetHour
      return {
        title: 'Skybox',
        subtitle: `Sunrise ${rise} · sunset ${set}`,
        media: SunIcon,
      }
    },
  },

  fields: [
    numberField({
      name: 'sunriseHour',
      title: 'Sunrise',
      description: `Hour of the day (0–24) the sun rises and the day begins. Visitors see the sky at their own local time. Default ${SKYBOX_DEFAULTS.sunriseHour}`,
      initialValue: SKYBOX_DEFAULTS.sunriseHour,
      group: 'day',
      min: 0,
      max: 24,
      precision: 1,
    }),
    numberField({
      name: 'sunsetHour',
      title: 'Sunset',
      description: `Hour of the day the sun sets. The moon stays up for the rest of the night. Default ${SKYBOX_DEFAULTS.sunsetHour}`,
      initialValue: SKYBOX_DEFAULTS.sunsetHour,
      group: 'day',
      min: 0,
      max: 24,
      precision: 1,
    }),
    numberField({
      name: 'timeSpeed',
      title: 'Day speed',
      description: `1 follows the visitor's clock. 1440 sweeps a whole day in a minute, for reviewing the design. Default ${SKYBOX_DEFAULTS.timeSpeed}`,
      initialValue: SKYBOX_DEFAULTS.timeSpeed,
      group: 'day',
      min: 0.01,
      max: 1440,
      precision: 2,
    }),

    numberField({
      name: 'sunRadius',
      title: 'Sun size',
      description: `The sun's radius as a fraction of the screen's shorter side. It shrinks slightly toward noon. Default ${SKYBOX_DEFAULTS.sunRadius}`,
      initialValue: SKYBOX_DEFAULTS.sunRadius,
      group: 'sky',
      min: 0.02,
      max: 0.2,
      precision: 3,
    }),
    numberField({
      name: 'moonRadius',
      title: 'Moon size',
      description: `The moon's radius at full night, as a fraction of the screen's shorter side. It is a third smaller at midday. Default ${SKYBOX_DEFAULTS.moonRadius}`,
      initialValue: SKYBOX_DEFAULTS.moonRadius,
      group: 'sky',
      min: 0.02,
      max: 0.2,
      precision: 3,
    }),

    numberField({
      name: 'starCount',
      title: 'Stars',
      description: `Stars at full night, before the mobile scale. Default ${SKYBOX_DEFAULTS.starCount}`,
      initialValue: SKYBOX_DEFAULTS.starCount,
      group: 'sky',
      min: 0,
      max: 500,
      integer: true,
    }),
    numberField({
      name: 'starSize',
      title: 'Star size',
      description: `Multiplies every star's size. 1 = the built-in size. Range 0.5–2. Default ${SKYBOX_DEFAULTS.starSize}`,
      initialValue: SKYBOX_DEFAULTS.starSize,
      group: 'sky',
      min: 0.5,
      max: 2,
      precision: 2,
    }),
    numberField({
      name: 'cloudCount',
      title: 'Clouds',
      description: `Clouds drifting across the sky, before the mobile scale. Default ${SKYBOX_DEFAULTS.cloudCount}`,
      initialValue: SKYBOX_DEFAULTS.cloudCount,
      group: 'sky',
      min: 0,
      max: 30,
      integer: true,
    }),
    numberField({
      name: 'cloudSpeed',
      title: 'Cloud speed',
      description: `Multiplies how fast the clouds drift. 1 = the built-in speed, 0 = still. Range 0–3. Default ${SKYBOX_DEFAULTS.cloudSpeed}`,
      initialValue: SKYBOX_DEFAULTS.cloudSpeed,
      group: 'sky',
      min: 0,
      max: 3,
      precision: 2,
    }),
    numberField({
      name: 'mobileScale',
      title: 'Phone scale',
      description: `Multiplies the star and cloud counts on phones. Range 0.1–1. Default ${SKYBOX_DEFAULTS.mobileScale}`,
      initialValue: SKYBOX_DEFAULTS.mobileScale,
      group: 'sky',
      min: 0.1,
      max: 1,
      precision: 2,
    }),

    // ── Immersive mode ───────────────────────────────────────────────────
    defineField({
      name: 'immersiveEnabled',
      title: 'Full-screen mode',
      description:
        'Lets visitors enter the full-screen view by clicking the four reindeer. Off means the scenery stays put. On by default.',
      type: 'boolean',
      group: 'immersive',
      initialValue: SKYBOX_DEFAULTS.immersiveEnabled,
    }),
    numberField({
      name: 'immersiveDayMinutes',
      title: 'Day length',
      description: `Real minutes one full day takes while in full-screen mode. Range 0.5–60. Default ${SKYBOX_DEFAULTS.immersiveDayMinutes}`,
      initialValue: SKYBOX_DEFAULTS.immersiveDayMinutes,
      group: 'immersive',
      min: 0.5,
      max: 60,
      precision: 1,
    }),
    numberField({
      name: 'immersiveRampSeconds',
      title: 'Speed ramp',
      description: `Seconds over which the day speed eases in after entering full-screen mode. 0 starts at full speed. Range 0–60. Default ${SKYBOX_DEFAULTS.immersiveRampSeconds}`,
      initialValue: SKYBOX_DEFAULTS.immersiveRampSeconds,
      group: 'immersive',
      min: 0,
      max: 60,
      precision: 1,
    }),
    numberField({
      name: 'immersiveFadeMs',
      title: 'Palette crossfade',
      description: `Milliseconds the sky and the scenery take to crossfade into their full-screen colors. Range 200–5000. Default ${SKYBOX_DEFAULTS.immersiveFadeMs}`,
      initialValue: SKYBOX_DEFAULTS.immersiveFadeMs,
      group: 'immersive',
      min: 200,
      max: 5000,
      integer: true,
    }),
    numberField({
      name: 'immersiveDarkening',
      title: 'Night deepening',
      description: `How much deeper the sky gets at midnight in full-screen mode. 0 leaves the themed night untouched. Range 0–0.8. Default ${SKYBOX_DEFAULTS.immersiveDarkening}`,
      initialValue: SKYBOX_DEFAULTS.immersiveDarkening,
      group: 'immersive',
      min: 0,
      max: 0.8,
      precision: 2,
    }),
    defineField({
      name: 'immersiveFlare',
      title: 'Lens flare',
      description:
        'A flare that follows the pointer in full-screen mode, from the sun. On by default.',
      type: 'boolean',
      group: 'immersive',
      initialValue: SKYBOX_DEFAULTS.immersiveFlare,
    }),

    colorsField('lightColors', 'Light theme colors', 'lightColors', 'light'),
    colorsField('darkColors', 'Dark theme colors', 'darkColors', 'dark'),
  ],
})
