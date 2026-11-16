import { EarthGlobeIcon } from '@sanity/icons/EarthGlobe'
import { MoonIcon } from '@sanity/icons/Moon'
import { RocketIcon } from '@sanity/icons/Rocket'
import { SparklesIcon } from '@sanity/icons/Sparkles'
import { StarIcon } from '@sanity/icons/Star'
import { SunIcon } from '@sanity/icons/Sun'
import {
  CHRISTMAS_COLOR_ROLES,
  CHRISTMAS_DEFAULTS,
  CHRISTMAS_MAX_LIGHT_COLORS,
} from '@shared/config/christmas-canvas'
import { defineField, defineType } from 'sanity'
import { type Context, numberField, THEME_COLORS } from './canvas-fields'

// Settings and colors of the Christmas background
// (next/components/ui/app-background/ChristmasCanvas.tsx).
// Every setting that is left empty falls back to CHRISTMAS_DEFAULTS, and every color
// that is left empty keeps the built-in color of the scenery for that theme.

const hideIfNoSnow = ({ parent }: Context) => parent?.enableSnow === false
const hideIfNoSanta = ({ parent }: Context) => parent?.enableSanta === false

// The scenery parts, grouped the way they are shown in the color tabs
const COLOR_FIELDSETS = [
  { name: 'mountains', title: 'Mountains' },
  { name: 'hills', title: 'Hills' },
  { name: 'trees', title: 'Pines' },
  { name: 'houses', title: 'Houses' },
  { name: 'weather', title: 'Snow and smoke' },
  { name: 'santa', title: 'Santa' },
]

const fieldsetFor = (role: string) => {
  if (role.startsWith('mountain')) return 'mountains'
  if (role.startsWith('hill')) return 'hills'
  if (role.startsWith('tree')) return 'trees'
  if (role.startsWith('house')) return 'houses'
  if (role === 'snowfall' || role === 'smoke') return 'weather'
  return 'santa'
}

/** One theme's color overrides. A named type rather than an object inline in
 * `christmasCanvas` because GraphQL cannot express an anonymous object: the
 * extractor needs a top-level type to give the field. */
export const ChristmasColors = defineType({
  name: 'christmasColors',
  title: 'Christmas background colors',
  type: 'object',
  fieldsets: COLOR_FIELDSETS.map((fieldset) => ({
    ...fieldset,
    options: { columns: 2 },
  })),
  fields: [
    ...CHRISTMAS_COLOR_ROLES.map((role) =>
      defineField({
        name: role.key,
        title: role.title,
        description: role.description,
        type: 'string',
        fieldset: fieldsetFor(role.key),
        options: { list: THEME_COLORS },
      })
    ),
    defineField({
      name: 'lights',
      title: 'Christmas light colors',
      description: `The bulbs on decorated trees and houses use these colors in turn (up to ${CHRISTMAS_MAX_LIGHT_COLORS}). Leave empty for red, golden yellow, green and blue.`,
      type: 'array',
      of: [{ type: 'string', options: { list: THEME_COLORS } }],
      validation: (rule) => rule.max(CHRISTMAS_MAX_LIGHT_COLORS),
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
    description: `Pick a theme color for any part of the scenery on the ${theme} theme. Parts left empty keep their built-in color. Shades, stripes and highlights are worked out from the color you pick.`,
    type: 'christmasColors',
    group,
    options: { collapsible: false },
  })

export const ChristmasCanvas = defineType({
  name: 'christmasCanvas',
  title: 'Christmas Canvas Config',
  type: 'document',
  icon: StarIcon,

  groups: [
    { name: 'scene', title: 'Scene', icon: EarthGlobeIcon, default: true },
    { name: 'snow', title: 'Snow', icon: SparklesIcon },
    { name: 'santa', title: 'Santa', icon: RocketIcon },
    { name: 'lightColors', title: 'Light theme colors', icon: SunIcon },
    { name: 'darkColors', title: 'Dark theme colors', icon: MoonIcon },
  ],

  fieldsets: [
    {
      name: 'decorations',
      title: 'Christmas lights and decorations',
      description:
        'How often a pine or a house is decorated with lights, baubles, a star or a wreath.',
      options: { columns: 2 },
    },
    {
      name: 'santaGaps',
      title: 'Time between flights (seconds)',
      description: 'Santa waits a random time in this range between flights.',
      options: { columns: 2 },
    },
  ],

  preview: {
    select: {
      enableSanta: 'enableSanta',
      enableSnow: 'enableSnow',
      snowDensity: 'snowDensity',
    },
    prepare({ enableSanta, enableSnow, snowDensity }) {
      const snow =
        enableSnow === false ? 'no snow' : `snow x${snowDensity ?? 1}`
      return {
        title: 'Christmas Canvas Background',
        subtitle: `${snow} · ${enableSanta === false ? 'no Santa' : 'Santa flying by'}`,
        media: StarIcon,
      }
    },
  },

  fields: [
    // ── Scene ────────────────────────────────────────────────────────────
    numberField({
      name: 'seed',
      title: 'Layout seed',
      description: `Changes the layout of the mountains, hills, pines and houses. The same number always gives the same scene, so try a few. Default ${CHRISTMAS_DEFAULTS.seed}`,
      initialValue: CHRISTMAS_DEFAULTS.seed,
      group: 'scene',
      min: 0,
      max: 999999,
      integer: true,
    }),
    numberField({
      name: 'treeDecorationChance',
      title: 'Pines',
      description: `Chance that a pine is decorated. 0 = never, 1 = every one. Range 0–1. Default ${CHRISTMAS_DEFAULTS.treeDecorationChance}`,
      initialValue: CHRISTMAS_DEFAULTS.treeDecorationChance,
      group: 'scene',
      fieldset: 'decorations',
      min: 0,
      max: 1,
      precision: 2,
    }),
    numberField({
      name: 'houseDecorationChance',
      title: 'Houses',
      description: `Chance that a house has lights along its roof and a wreath. Range 0–1. Default ${CHRISTMAS_DEFAULTS.houseDecorationChance}`,
      initialValue: CHRISTMAS_DEFAULTS.houseDecorationChance,
      group: 'scene',
      fieldset: 'decorations',
      min: 0,
      max: 1,
      precision: 2,
    }),
    defineField({
      name: 'enableSmoke',
      title: 'Chimney smoke',
      description: 'Smoke drifting up from the chimneys. On by default.',
      type: 'boolean',
      group: 'scene',
      initialValue: CHRISTMAS_DEFAULTS.enableSmoke,
    }),

    // ── Snow ─────────────────────────────────────────────────────────────
    defineField({
      name: 'enableSnow',
      title: 'Falling snow',
      description: 'Turns the falling snowflakes on or off. On by default.',
      type: 'boolean',
      group: 'snow',
      initialValue: CHRISTMAS_DEFAULTS.enableSnow,
    }),
    numberField({
      name: 'snowDensity',
      title: 'Snow amount',
      description: `1 = the default amount, 2 = twice as many flakes. Phones always get fewer. Range 0–3. Default ${CHRISTMAS_DEFAULTS.snowDensity}`,
      initialValue: CHRISTMAS_DEFAULTS.snowDensity,
      group: 'snow',
      hidden: hideIfNoSnow,
      min: 0,
      max: 3,
      precision: 2,
    }),
    numberField({
      name: 'snowSpeed',
      title: 'Snow speed',
      description: `1 = the default fall speed. Range 0–3. Default ${CHRISTMAS_DEFAULTS.snowSpeed}`,
      initialValue: CHRISTMAS_DEFAULTS.snowSpeed,
      group: 'snow',
      hidden: hideIfNoSnow,
      min: 0,
      max: 3,
      precision: 2,
    }),

    // ── Santa ────────────────────────────────────────────────────────────
    defineField({
      name: 'enableSanta',
      title: 'Santa and his sleigh',
      description: 'Santa flies across the sky now and then. On by default.',
      type: 'boolean',
      group: 'santa',
      initialValue: CHRISTMAS_DEFAULTS.enableSanta,
    }),
    numberField({
      name: 'santaFirstDelaySeconds',
      title: 'First flight after',
      description: `Seconds after the page loads until Santa first appears. Range 0–600. Default ${CHRISTMAS_DEFAULTS.santaFirstDelaySeconds}`,
      initialValue: CHRISTMAS_DEFAULTS.santaFirstDelaySeconds,
      group: 'santa',
      hidden: hideIfNoSanta,
      min: 0,
      max: 600,
      precision: 1,
    }),
    numberField({
      name: 'santaMinGapSeconds',
      title: 'Shortest wait',
      description: `Range 5–600. Default ${CHRISTMAS_DEFAULTS.santaMinGapSeconds}`,
      initialValue: CHRISTMAS_DEFAULTS.santaMinGapSeconds,
      group: 'santa',
      fieldset: 'santaGaps',
      hidden: hideIfNoSanta,
      min: 5,
      max: 600,
      precision: 1,
    }),
    defineField({
      name: 'santaMaxGapSeconds',
      title: 'Longest wait',
      description: `Range 5–1200, and not shorter than the shortest wait. Default ${CHRISTMAS_DEFAULTS.santaMaxGapSeconds}`,
      type: 'number',
      group: 'santa',
      fieldset: 'santaGaps',
      hidden: hideIfNoSanta,
      initialValue: CHRISTMAS_DEFAULTS.santaMaxGapSeconds,
      validation: (rule) =>
        rule
          .min(5)
          .max(1200)
          .precision(1)
          .custom((value, context) => {
            const min =
              (context.document?.santaMinGapSeconds as number | undefined) ??
              CHRISTMAS_DEFAULTS.santaMinGapSeconds
            return value !== undefined && value < min
              ? 'Must not be shorter than the shortest wait'
              : true
          }),
    }),

    // ── Colors, one set per theme ────────────────────────────────────────
    colorsField('lightColors', 'Light theme colors', 'lightColors', 'light'),
    colorsField('darkColors', 'Dark theme colors', 'darkColors', 'dark'),
  ],
})
