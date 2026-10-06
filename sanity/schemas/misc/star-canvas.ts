import { BoltIcon } from '@sanity/icons/Bolt'
import { CircleIcon } from '@sanity/icons/Circle'
import { ColorWheelIcon } from '@sanity/icons/ColorWheel'
import { EarthGlobeIcon } from '@sanity/icons/EarthGlobe'
import { MoonIcon } from '@sanity/icons/Moon'
import { RocketIcon } from '@sanity/icons/Rocket'
import { SparklesIcon } from '@sanity/icons/Sparkles'
import { StarIcon } from '@sanity/icons/Star'
import { defineField, defineType } from 'sanity'

// Values must match CSS theme variables (--color-<value> or --<value>)
const THEME_COLORS = [
  { title: 'Brand (Blue)', value: 'brand' },
  { title: 'Brand Light', value: 'brand-300' },
  { title: 'Brand Dark', value: 'brand-850' },
  { title: 'Sky', value: 'sky' },
  { title: 'Jade', value: 'jade' },
  { title: 'Lavender', value: 'lavender' },
  { title: 'Rose Pink', value: 'rose-pink' },
  { title: 'Amber', value: 'amber' },
  { title: 'Golden Yellow', value: 'golden-yellow' },
  { title: 'Yellow', value: 'yellow' },
  { title: 'Error Red', value: 'error-red' },
  { title: 'White / Lightest', value: 'background-50' },
  { title: 'Grey Light', value: 'grey-200' },
  { title: 'Grey', value: 'grey-300' },
  { title: 'Grey Dark', value: 'grey-800' },
  { title: 'Black / Darkest', value: 'background-1000' },
]

type Context = { parent?: Record<string, unknown> }

const hideUnlessCustomPosition = ({ parent }: Context) =>
  parent?.blackHolePresetPosition !== 'custom'

const hideUnlessCustomGalaxyPosition = ({ parent }: Context) =>
  !parent?.enableGalaxy || parent?.galaxyPosition !== 'custom'

const hideIfNoGalaxy = ({ parent }: Context) => !parent?.enableGalaxy

const hideIfNoFlare = ({ parent }: Context) => !parent?.enableBlackHoleFlare

// Orbiting planets need the black hole to orbit
const hideIfNoBlackHole = ({ parent }: Context) => !parent?.enableBlackHole

// The black hole tabs disappear entirely while the black hole is switched off
const blackHoleDisabled = ({ value }: { value?: unknown }) =>
  !(value as { enableBlackHole?: boolean } | undefined)?.enableBlackHole

type NumberFieldOptions = {
  name: string
  title: string
  description: string
  initialValue: number
  group: string
  fieldset?: string
  min?: number
  max?: number
  integer?: boolean
  precision?: number
  hidden?: (context: Context) => boolean
}

const numberField = ({
  name,
  title,
  description,
  initialValue,
  group,
  fieldset,
  min,
  max,
  integer,
  precision,
  hidden,
}: NumberFieldOptions) =>
  defineField({
    name,
    title,
    description,
    type: 'number',
    group,
    fieldset,
    hidden,
    initialValue,
    validation: (rule) => {
      let r = rule
      if (integer) r = r.integer()
      if (min !== undefined) r = r.min(min)
      if (max !== undefined) r = r.max(max)
      if (precision !== undefined) r = r.precision(precision)
      return r
    },
  })

const colorField = (
  name: string,
  title: string,
  description: string,
  initialValue: string,
  group: string,
  fieldset?: string
) =>
  defineField({
    name,
    title,
    description,
    type: 'string',
    group,
    fieldset,
    options: { list: THEME_COLORS },
    initialValue,
  })

export const StarCanvas = defineType({
  name: 'starCanvas',
  title: 'Star Canvas Config',
  type: 'document',
  icon: StarIcon,

  // Tabs: one per part of the effect, so each screen only shows related settings
  groups: [
    { name: 'stars', title: 'Stars', icon: StarIcon, default: true },
    { name: 'shootingStars', title: 'Shooting Stars', icon: RocketIcon },
    { name: 'blackHole', title: 'Black Hole', icon: CircleIcon },
    {
      name: 'gravity',
      title: 'Gravity & Hover',
      icon: BoltIcon,
      hidden: blackHoleDisabled,
    },
    {
      name: 'smoke',
      title: 'Smoke & Edge',
      icon: SparklesIcon,
      hidden: blackHoleDisabled,
    },
    { name: 'planets', title: 'Planets', icon: EarthGlobeIcon },
    { name: 'galaxy', title: 'Galaxy', icon: MoonIcon },
    {
      name: 'colors',
      title: 'Black Hole Colors',
      icon: ColorWheelIcon,
      hidden: blackHoleDisabled,
    },
  ],

  // Sub-sections inside a tab (2 columns for related number pairs)
  fieldsets: [
    { name: 'starSize', title: 'Star size (px)', options: { columns: 2 } },
    { name: 'position', title: 'Position' },
    { name: 'sizes', title: 'Sizes (px)', options: { columns: 2 } },
    {
      name: 'pull',
      title: 'Gravity (always on)',
      description: 'How the hole pulls stars and shooting stars in.',
      options: { columns: 2 },
    },
    {
      name: 'hover',
      title: 'Gravity on hover',
      description:
        'When the pointer is inside the glow, gravity ramps up smoothly to these multipliers. Use 1 for no change.',
      options: { columns: 2 },
    },
    {
      name: 'smokeSettings',
      title: 'Smoke around the hole',
      options: { columns: 2 },
    },
    {
      name: 'edgeSettings',
      title: 'Rippling edge (px)',
      description: 'How wobbly the rim of the hole and its ring look.',
      options: { columns: 2 },
    },
    {
      name: 'planetLook',
      title: 'Look of every planet',
      description:
        'Used by both orbiting and free planets. Color, pattern and ring are randomly generated on every page load.',
      options: { columns: 2 },
    },
    {
      name: 'planetOrbit',
      title: 'Planets orbiting the black hole',
      description:
        'Needs the black hole. Orbits are spread evenly between the closest and farthest distance.',
      options: { columns: 2 },
    },
    {
      name: 'freePlanets',
      title: 'Planets outside orbit',
      description:
        'Planets that drift slowly across the screen like stars, and get pulled in by the black hole if they come close.',
      options: { columns: 2 },
    },
    {
      name: 'galaxyPlacement',
      title: 'Where',
      description:
        'The galaxy sits in this area of the screen, shifted a little randomly on every page load.',
      options: { columns: 2 },
    },
    {
      name: 'galaxyShape',
      title: 'Shape',
      description:
        'Stretch the band. Stars keep their size, so a bigger band is also a sparser one: raise the density below to compensate, or leave it for a more spread out look.',
      options: { columns: 2 },
    },
    {
      name: 'galaxyDensities',
      title: 'Density',
      description:
        'How many stars and clouds there are. The final density at the center is Overall × Center, and at the far ends Overall × Ends.',
      options: { columns: 3 },
    },
    {
      name: 'galaxyLook',
      title: 'Look',
      options: { columns: 2 },
    },
    { name: 'galaxyColors', title: 'Colors', options: { columns: 2 } },
    {
      name: 'backgroundHaze',
      title: 'Background haze',
      description:
        'A soft, grayish circle behind everything: strongest in the middle of the screen and fading into your normal background at the edges, so the stars and glow stand out more.',
      options: { columns: 2 },
    },
    {
      name: 'rimSettings',
      title: 'Ring, corona and flare',
      description:
        'The light around the hole, like an eclipse: the ring glows, the corona fades from the ring out into the glow, and the flare is one bright spot on the rim.',
      options: { columns: 2 },
    },
    { name: 'glowColors', title: 'Colors' },
  ],

  preview: {
    select: {
      starCount: 'starCount',
      enableBlackHole: 'enableBlackHole',
      preset: 'blackHolePresetPosition',
      xRatio: 'blackHoleXRatio',
      yRatio: 'blackHoleYRatio',
    },
    prepare({ starCount, enableBlackHole, preset, xRatio, yRatio }) {
      const where =
        preset && preset !== 'custom'
          ? preset
          : `${Math.round((xRatio ?? 0.5) * 100)}%, ${Math.round((yRatio ?? 0.48) * 100)}%`
      return {
        title: 'Star Canvas Background',
        subtitle: `${starCount ?? 200} stars · ${enableBlackHole ? `black hole (${where})` : 'black hole off'}`,
        media: StarIcon,
      }
    },
  },

  fields: [
    // ── Stars ────────────────────────────────────────────────────────────
    numberField({
      name: 'starCount',
      title: 'Star count',
      description:
        'How many twinkling stars. More looks denser, costs a bit more performance. Range 0–1000. Default 200.',
      initialValue: 200,
      group: 'stars',
      min: 0,
      max: 1000,
      integer: true,
    }),
    defineField({
      name: 'starColors',
      title: 'Star color palette',
      description: 'Each star gets one random color from this list.',
      type: 'array',
      group: 'stars',
      of: [{ type: 'string', options: { list: THEME_COLORS } }],
      initialValue: [
        'background-50',
        'sky',
        'brand-300',
        'lavender',
        'grey-300',
      ],
    }),
    numberField({
      name: 'starMinSize',
      title: 'Smallest star',
      description: 'Radius. Default 0.4',
      initialValue: 0.4,
      group: 'stars',
      fieldset: 'starSize',
      min: 0.1,
      precision: 2,
    }),
    numberField({
      name: 'starMaxSize',
      title: 'Largest star',
      description: 'Radius. Default 1.3',
      initialValue: 1.3,
      group: 'stars',
      fieldset: 'starSize',
      min: 0.5,
      precision: 2,
    }),
    numberField({
      name: 'starDriftSpeed',
      title: 'Drift speed',
      description:
        'Slow diagonal drift of the whole starfield, px per frame at 60fps. 0 = still. Default 0.012',
      initialValue: 0.012,
      group: 'stars',
      min: 0,
      precision: 4,
    }),

    colorField(
      'backgroundHazeColor',
      'Haze color',
      'A grayish space color. Default: Grey Dark',
      'grey-800',
      'stars',
      'backgroundHaze'
    ),
    numberField({
      name: 'backgroundHazeOpacity',
      title: 'Haze strength',
      description:
        'How visible the haze is in the middle. 0 = none. Range 0–1. Default 0.5',
      initialValue: 0.5,
      group: 'stars',
      fieldset: 'backgroundHaze',
      min: 0,
      max: 1,
      precision: 2,
    }),
    numberField({
      name: 'backgroundHazeRadius',
      title: 'Haze size',
      description:
        'How far the haze reaches, as a share of the distance from the middle of the screen to its corner. 1 = all the way. Range 0.2–2. Default 0.9',
      initialValue: 0.9,
      group: 'stars',
      fieldset: 'backgroundHaze',
      min: 0.2,
      max: 2,
      precision: 2,
    }),

    // ── Shooting stars ───────────────────────────────────────────────────
    numberField({
      name: 'shootingStarChance',
      title: 'Frequency',
      description:
        'Chance of a new shooting star per frame at 60fps. 0.008 is roughly one every two seconds. Range 0–0.1. Default 0.008',
      initialValue: 0.008,
      group: 'shootingStars',
      min: 0,
      max: 0.1,
      precision: 4,
    }),
    colorField(
      'shootingStarColor',
      'Trail color',
      'Color of the fading trail. Default: Sky',
      'sky',
      'shootingStars'
    ),

    // ── Black hole: on/off, placement, size ──────────────────────────────
    defineField({
      name: 'enableBlackHole',
      title: 'Enable black hole',
      description:
        'Turns off the hole, its gravity, smoke, hover effect and orbiting planets. The Gravity, Smoke and Colors tabs hide when this is off. Free planets and the galaxy are not affected.',
      type: 'boolean',
      group: 'blackHole',
      initialValue: true,
    }),
    defineField({
      name: 'blackHolePresetPosition',
      title: 'Placement',
      description: 'Pick a preset, or Custom to set the exact position below.',
      type: 'string',
      group: 'blackHole',
      fieldset: 'position',
      options: {
        list: [
          { title: 'Center', value: 'center' },
          { title: 'Top-right', value: 'top-right' },
          { title: 'Bottom-right', value: 'bottom-right' },
          { title: 'Custom', value: 'custom' },
        ],
        layout: 'radio',
      },
      initialValue: 'custom',
    }),
    numberField({
      name: 'blackHoleXRatio',
      title: 'Horizontal position',
      description: '0 = left edge, 0.5 = center, 1 = right edge. Default 0.5',
      initialValue: 0.5,
      group: 'blackHole',
      fieldset: 'position',
      min: 0,
      max: 1,
      precision: 4,
      hidden: hideUnlessCustomPosition,
    }),
    numberField({
      name: 'blackHoleYRatio',
      title: 'Vertical position',
      description: '0 = top, 0.5 = center, 1 = bottom. Default 0.48',
      initialValue: 0.48,
      group: 'blackHole',
      fieldset: 'position',
      min: 0,
      max: 1,
      precision: 4,
      hidden: hideUnlessCustomPosition,
    }),
    numberField({
      name: 'blackHoleRadius',
      title: 'Hole radius',
      description:
        'The dark core. Anything crossing it is swallowed. Default 65',
      initialValue: 65,
      group: 'blackHole',
      fieldset: 'sizes',
      min: 1,
    }),
    numberField({
      name: 'blackHoleGlowRadius',
      title: 'Glow radius',
      description:
        'Outer edge of the glow. Also the area where hovering triggers the hover effects. Default 210',
      initialValue: 210,
      group: 'blackHole',
      fieldset: 'sizes',
      min: 1,
    }),

    // ── Gravity & hover ──────────────────────────────────────────────────
    defineField({
      name: 'blackHoleGravityRadius',
      title: 'Reach',
      description:
        'Distance from the center where stars start to be pulled. Must be larger than the hole radius. Default 360',
      type: 'number',
      group: 'gravity',
      fieldset: 'pull',
      initialValue: 360,
      validation: (rule) =>
        rule
          .min(1)
          .custom((value, context) => {
            const radius = (
              context.document as { blackHoleRadius?: number } | undefined
            )?.blackHoleRadius
            return value != null && radius != null && value <= radius
              ? 'Reach should be larger than the hole radius, otherwise nothing gets pulled in.'
              : true
          })
          .warning(),
    }),
    numberField({
      name: 'blackHoleGravityForce',
      title: 'Strength',
      description:
        'Pull in px per frame at its strongest (just outside the hole). Default 0.35',
      initialValue: 0.35,
      group: 'gravity',
      fieldset: 'pull',
      min: 0,
    }),
    numberField({
      name: 'blackHoleHoverReachMultiplier',
      title: 'Reach ×',
      description:
        'Reach is multiplied by this at full hover. 1.5 = 50% farther. Default 1.5',
      initialValue: 1.5,
      group: 'gravity',
      fieldset: 'hover',
      min: 0.1,
      max: 5,
      precision: 2,
    }),
    numberField({
      name: 'blackHoleHoverGravityMultiplier',
      title: 'Strength ×',
      description:
        'Strength is multiplied by this at full hover. 2 = twice as strong. Default 2',
      initialValue: 2,
      group: 'gravity',
      fieldset: 'hover',
      min: 0.1,
      max: 10,
      precision: 2,
    }),

    // ── Smoke & edge ─────────────────────────────────────────────────────
    numberField({
      name: 'blackHoleSmokeWisps',
      title: 'Wisps',
      description:
        'Number of drifting smoke blobs. 0 = no smoke. Range 0–16. Default 7',
      initialValue: 7,
      group: 'smoke',
      fieldset: 'smokeSettings',
      min: 0,
      max: 16,
      integer: true,
    }),
    numberField({
      name: 'blackHoleSmokeIntensity',
      title: 'Intensity',
      description:
        'How visible the smoke is. 1 = normal, 0 = invisible, 2 = very strong. Default 1',
      initialValue: 1,
      group: 'smoke',
      fieldset: 'smokeSettings',
      min: 0,
      max: 3,
      precision: 2,
    }),
    numberField({
      name: 'blackHoleSmokeSpeed',
      title: 'Speed',
      description:
        'How fast the smoke churns. 1 = normal, 0 = frozen. Default 1',
      initialValue: 1,
      group: 'smoke',
      fieldset: 'smokeSettings',
      min: 0,
      max: 5,
      precision: 2,
    }),
    numberField({
      name: 'blackHoleEdgeRipple',
      title: 'Resting ripple',
      description:
        'Edge wobble when nothing is hovering. 0 = perfect circle. Default 0.8',
      initialValue: 0.8,
      group: 'smoke',
      fieldset: 'edgeSettings',
      min: 0,
      max: 20,
      precision: 2,
    }),
    numberField({
      name: 'blackHoleHoverRipple',
      title: 'Extra ripple on hover',
      description: 'Added to the resting ripple at full hover. Default 3',
      initialValue: 3,
      group: 'smoke',
      fieldset: 'edgeSettings',
      min: 0,
      max: 30,
      precision: 2,
    }),

    numberField({
      name: 'blackHoleCoronaWidth',
      title: 'Corona width',
      description:
        'How far the corona reaches past the ring, in hole radii: 0.6 = 60% of the radius. 0 = no corona. Range 0–3. Default 0.6',
      initialValue: 0.6,
      group: 'smoke',
      fieldset: 'rimSettings',
      min: 0,
      max: 3,
      precision: 2,
    }),
    defineField({
      name: 'enableBlackHoleFlare',
      title: 'Show rim flare',
      description:
        'The bright arc on one side of the rim, like the diamond ring of an eclipse. Turn it off to remove it completely.',
      type: 'boolean',
      group: 'smoke',
      fieldset: 'rimSettings',
      initialValue: true,
    }),
    numberField({
      name: 'blackHoleFlare',
      title: 'Rim flare brightness',
      description:
        'How bright the flare is. It follows the curve of the hole and spills a little into it. Range 0–1. Default 0.7',
      initialValue: 0.7,
      group: 'smoke',
      fieldset: 'rimSettings',
      min: 0,
      max: 1,
      precision: 2,
      hidden: hideIfNoFlare,
    }),
    numberField({
      name: 'blackHoleFlareSpin',
      title: 'Flare spin on hover',
      description:
        'While the pointer is over the black hole, the flare spins around the rim. 1 = about a turn every 10 seconds, 0 = it stays put. Range 0–5. Default 1',
      initialValue: 1,
      group: 'smoke',
      fieldset: 'rimSettings',
      min: 0,
      max: 5,
      precision: 2,
      hidden: hideIfNoFlare,
    }),
    numberField({
      name: 'blackHoleRingGlow',
      title: 'Photon ring glow',
      description:
        'How much the thin ring around the hole glows. 0 = a plain thin line, 1 = normal glow, 2 = very bright. Range 0–3. Default 1',
      initialValue: 1,
      group: 'smoke',
      fieldset: 'rimSettings',
      min: 0,
      max: 3,
      precision: 2,
    }),

    // ── Planets ──────────────────────────────────────────────────────────
    defineField({
      name: 'planetColors',
      title: 'Color palette',
      description:
        'Each planet gets one random color from this list. Bands, spots and shading are generated from it.',
      type: 'array',
      group: 'planets',
      fieldset: 'planetLook',
      of: [{ type: 'string', options: { list: THEME_COLORS } }],
      initialValue: ['amber', 'rose-pink', 'sky', 'lavender', 'jade'],
    }),
    numberField({
      name: 'planetMinSize',
      title: 'Smallest planet',
      description: 'Radius. Default 4',
      initialValue: 4,
      group: 'planets',
      fieldset: 'planetLook',
      min: 1,
      precision: 1,
    }),
    numberField({
      name: 'planetMaxSize',
      title: 'Largest planet',
      description: 'Radius. Default 11',
      initialValue: 11,
      group: 'planets',
      fieldset: 'planetLook',
      min: 1,
      precision: 1,
    }),
    numberField({
      name: 'planetRingChance',
      title: 'Ring chance',
      description:
        'Chance each planet has a ring. 0 = never, 1 = always. Default 0.25',
      initialValue: 0.25,
      group: 'planets',
      fieldset: 'planetLook',
      min: 0,
      max: 1,
      precision: 2,
    }),
    numberField({
      name: 'planetSizeRarity',
      title: 'Large planet rarity',
      description:
        'How rare big planets are. 1 = sizes evenly mixed, higher = mostly small planets with only a few big ones. Range 1–6. Default 3',
      initialValue: 3,
      group: 'planets',
      fieldset: 'planetLook',
      min: 1,
      max: 6,
      precision: 1,
    }),

    defineField({
      name: 'enablePlanets',
      title: 'Enable orbiting planets',
      type: 'boolean',
      group: 'planets',
      fieldset: 'planetOrbit',
      hidden: hideIfNoBlackHole,
      initialValue: true,
    }),
    numberField({
      name: 'planetCount',
      title: 'Orbiting count',
      description: 'Range 0–12. Default 4',
      initialValue: 4,
      group: 'planets',
      fieldset: 'planetOrbit',
      min: 0,
      max: 12,
      integer: true,
      hidden: hideIfNoBlackHole,
    }),
    numberField({
      name: 'planetOrbitMinRatio',
      title: 'Closest orbit ×',
      description:
        'In hole radii: 2 = twice the hole radius from the center. Must be above 1 or planets sit inside the hole. Default 1.8',
      initialValue: 1.8,
      group: 'planets',
      fieldset: 'planetOrbit',
      min: 1.1,
      max: 10,
      precision: 2,
      hidden: hideIfNoBlackHole,
    }),
    defineField({
      name: 'planetOrbitMaxRatio',
      title: 'Farthest orbit ×',
      description:
        'In hole radii. Should be at least the closest orbit. Default 3.5',
      type: 'number',
      group: 'planets',
      fieldset: 'planetOrbit',
      hidden: hideIfNoBlackHole,
      initialValue: 3.5,
      validation: (rule) =>
        rule
          .min(1.1)
          .max(10)
          .precision(2)
          .custom((value, context) => {
            const min = (
              context.document as { planetOrbitMinRatio?: number } | undefined
            )?.planetOrbitMinRatio
            return value != null && min != null && value < min
              ? 'Farthest orbit should be at least the closest orbit.'
              : true
          })
          .warning(),
    }),
    numberField({
      name: 'planetOrbitTilt',
      title: 'Orbit tilt',
      description:
        'How the orbits are viewed. 1 = from straight above (circles), small = nearly edge-on (flat ovals). Planets on the far half pass behind the hole. Range 0.05–1. Default 0.35',
      initialValue: 0.35,
      group: 'planets',
      fieldset: 'planetOrbit',
      min: 0.05,
      max: 1,
      precision: 2,
      hidden: hideIfNoBlackHole,
    }),
    numberField({
      name: 'planetSpeed',
      title: 'Orbit speed',
      description:
        "Scales every planet's own speed. Each planet is different: farther out and bigger planets are slower. 0 = frozen. Default 1",
      initialValue: 1,
      group: 'planets',
      fieldset: 'planetOrbit',
      min: 0,
      max: 5,
      precision: 2,
      hidden: hideIfNoBlackHole,
    }),
    numberField({
      name: 'planetHoverChaos',
      title: 'Hover chaos',
      description:
        'While the pointer is over the black hole, planets speed up and slow down at their own pace, wobble in and out and spin faster. 0 = no change, 1 = normal, 2+ = wild. Default 1',
      initialValue: 1,
      group: 'planets',
      fieldset: 'planetOrbit',
      min: 0,
      max: 3,
      precision: 2,
      hidden: hideIfNoBlackHole,
    }),

    numberField({
      name: 'freePlanetCount',
      title: 'Free planet count',
      description: 'Range 0–12. 0 = none. Default 3',
      initialValue: 3,
      group: 'planets',
      fieldset: 'freePlanets',
      min: 0,
      max: 12,
      integer: true,
    }),
    numberField({
      name: 'freePlanetDriftSpeed',
      title: 'Drift speed',
      description: 'px per frame at 60fps. 0 = still. Default 0.04',
      initialValue: 0.04,
      group: 'planets',
      fieldset: 'freePlanets',
      min: 0,
      max: 2,
      precision: 3,
    }),

    // ── Galaxy ───────────────────────────────────────────────────────────
    defineField({
      name: 'enableGalaxy',
      title: 'Show Milky Way',
      description:
        'A randomly generated Milky Way far in the background, behind everything else: colored clouds, dark dust and thousands of stars that twinkle slightly. Its bend, bright center and star pattern change on every page load.',
      type: 'boolean',
      group: 'galaxy',
      initialValue: true,
    }),
    defineField({
      name: 'galaxyPosition',
      title: 'General location',
      description:
        'Pick an area, Random for anywhere, or Custom to set the exact spot below.',
      type: 'string',
      group: 'galaxy',
      fieldset: 'galaxyPlacement',
      hidden: hideIfNoGalaxy,
      options: {
        list: [
          { title: 'Top-left', value: 'top-left' },
          { title: 'Top-right', value: 'top-right' },
          { title: 'Bottom-left', value: 'bottom-left' },
          { title: 'Bottom-right', value: 'bottom-right' },
          { title: 'Left', value: 'left' },
          { title: 'Right', value: 'right' },
          { title: 'Center', value: 'center' },
          { title: 'Random (anywhere)', value: 'random' },
          { title: 'Custom', value: 'custom' },
        ],
      },
      initialValue: 'bottom-left',
    }),
    numberField({
      name: 'galaxyXRatio',
      title: 'Horizontal position',
      description: '0 = left edge, 1 = right edge. Default 0.2',
      initialValue: 0.2,
      group: 'galaxy',
      fieldset: 'galaxyPlacement',
      min: 0,
      max: 1,
      precision: 3,
      hidden: hideUnlessCustomGalaxyPosition,
    }),
    numberField({
      name: 'galaxyYRatio',
      title: 'Vertical position',
      description: '0 = top, 1 = bottom. Default 0.78',
      initialValue: 0.78,
      group: 'galaxy',
      fieldset: 'galaxyPlacement',
      min: 0,
      max: 1,
      precision: 3,
      hidden: hideUnlessCustomGalaxyPosition,
    }),
    numberField({
      name: 'galaxyMinSize',
      title: 'Smallest size',
      description:
        'Base size in px. The band is 4 times this long (most of it a thin, fading tail), and its size is random between the smallest and largest. Default 320',
      initialValue: 320,
      group: 'galaxy',
      fieldset: 'galaxyLook',
      min: 50,
      max: 3000,
      hidden: hideIfNoGalaxy,
    }),
    numberField({
      name: 'galaxyMaxSize',
      title: 'Largest size',
      description:
        'Base size in px (the band is 4 times this long). Default 520',
      initialValue: 520,
      group: 'galaxy',
      fieldset: 'galaxyLook',
      min: 50,
      max: 3000,
      hidden: hideIfNoGalaxy,
    }),
    numberField({
      name: 'galaxyTilt',
      title: 'Tilt (degrees)',
      description:
        'Which way the Milky Way points. 0 = flat and horizontal, 30 = the right end tilts up, -30 = the left end tilts up, 90 or -90 = vertical. Range -90 to 90. Default 0',
      initialValue: 0,
      group: 'galaxy',
      fieldset: 'galaxyLook',
      min: -90,
      max: 90,
      precision: 1,
      hidden: hideIfNoGalaxy,
    }),
    numberField({
      name: 'galaxyDriftFactor',
      title: 'Drift speed ×',
      description:
        'How fast the Milky Way drifts compared to the stars (their speed is set in the Stars tab). 0.4 = 40% as fast. Moving slower than the stars makes it look farther away. 0 = still. Range 0–1. Default 0.4',
      initialValue: 0.4,
      group: 'galaxy',
      fieldset: 'galaxyLook',
      min: 0,
      max: 1,
      precision: 2,
      hidden: hideIfNoGalaxy,
    }),
    defineField({
      name: 'galaxyDriftDirection',
      title: 'Drift direction',
      description:
        'Which way the Milky Way drifts across the screen. The stars drift up and to the left. Default: Up-left',
      type: 'string',
      group: 'galaxy',
      fieldset: 'galaxyLook',
      hidden: hideIfNoGalaxy,
      options: {
        list: [
          { title: 'Up-left (like the stars)', value: 'up-left' },
          { title: 'Up', value: 'up' },
          { title: 'Up-right', value: 'up-right' },
          { title: 'Left', value: 'left' },
          { title: 'Right', value: 'right' },
          { title: 'Down-left', value: 'down-left' },
          { title: 'Down', value: 'down' },
          { title: 'Down-right', value: 'down-right' },
        ],
      },
      initialValue: 'up-left',
    }),
    numberField({
      name: 'galaxyOpacity',
      title: 'Opacity',
      description: '0 = invisible, 1 = full. Range 0–1. Default 0.7',
      initialValue: 0.7,
      group: 'galaxy',
      fieldset: 'galaxyLook',
      min: 0,
      max: 1,
      precision: 2,
      hidden: hideIfNoGalaxy,
    }),
    numberField({
      name: 'galaxyWidthScale',
      title: 'Width ×',
      description:
        'Stretches the length of the band. 1 = normal, 2 = twice as long. Range 0.3–3. Default 1',
      initialValue: 1,
      group: 'galaxy',
      fieldset: 'galaxyShape',
      min: 0.3,
      max: 3,
      precision: 2,
      hidden: hideIfNoGalaxy,
    }),
    numberField({
      name: 'galaxyHeightScale',
      title: 'Height ×',
      description:
        'Makes the band thicker or thinner. 1 = normal, 2 = twice as thick. Range 0.2–4. Default 1',
      initialValue: 1,
      group: 'galaxy',
      fieldset: 'galaxyShape',
      min: 0.2,
      max: 4,
      precision: 2,
      hidden: hideIfNoGalaxy,
    }),
    numberField({
      name: 'galaxyDensity',
      title: 'Overall ×',
      description:
        'Multiplies everything. Lower is also faster to build. Range 0.1–3. Default 1',
      initialValue: 1,
      group: 'galaxy',
      fieldset: 'galaxyDensities',
      min: 0.1,
      max: 3,
      precision: 2,
      hidden: hideIfNoGalaxy,
    }),
    numberField({
      name: 'galaxyCenterDensity',
      title: 'Center ×',
      description:
        'Stars and clouds around the bright center. 0 = an empty center. Range 0–4. Default 1',
      initialValue: 1,
      group: 'galaxy',
      fieldset: 'galaxyDensities',
      min: 0,
      max: 4,
      precision: 2,
      hidden: hideIfNoGalaxy,
    }),
    numberField({
      name: 'galaxyEndDensity',
      title: 'Ends ×',
      description:
        'Stars and clouds in the long tails on both sides. Higher = the band stays full farther out, 0 = no tails. Range 0–4. Default 1',
      initialValue: 1,
      group: 'galaxy',
      fieldset: 'galaxyDensities',
      min: 0,
      max: 4,
      precision: 2,
      hidden: hideIfNoGalaxy,
    }),
    defineField({
      name: 'galaxyCoreColor',
      title: 'Warm color',
      description:
        'The clouds on one side of the dust lane, around the center. The very middle of the galaxy is always pure white. Default: Amber',
      type: 'string',
      group: 'galaxy',
      fieldset: 'galaxyColors',
      hidden: hideIfNoGalaxy,
      options: { list: THEME_COLORS },
      initialValue: 'amber',
    }),
    defineField({
      name: 'galaxyArmColor',
      title: 'Cool color',
      description:
        'The clouds on the other side of the dust lane, and the outer parts. Default: Sky',
      type: 'string',
      group: 'galaxy',
      fieldset: 'galaxyColors',
      hidden: hideIfNoGalaxy,
      options: { list: THEME_COLORS },
      initialValue: 'sky',
    }),
    defineField({
      name: 'galaxyAccentColor',
      title: 'Accent color',
      description:
        'Patches of nebula and some of the stars, mixed in between the warm and cool colors. Default: Lavender',
      type: 'string',
      group: 'galaxy',
      fieldset: 'galaxyColors',
      hidden: hideIfNoGalaxy,
      options: { list: THEME_COLORS },
      initialValue: 'lavender',
    }),

    // ── Colors ───────────────────────────────────────────────────────────
    colorField(
      'blackHoleCoreColor',
      'Core',
      'The solid center. Default: Black / Darkest',
      'background-1000',
      'colors',
      'glowColors'
    ),
    colorField(
      'blackHolePhotonRingColor',
      'Photon ring',
      'Thin ring just outside the core. Default: Sky',
      'sky',
      'colors',
      'glowColors'
    ),
    colorField(
      'blackHoleBaseGlowColor',
      'Glow and smoke',
      'The glow fading into the background, and the smoke drifting in it. Default: Brand (Blue)',
      'brand',
      'colors',
      'glowColors'
    ),
    colorField(
      'blackHoleCoronaColor',
      'Corona',
      'The layer just outside the ring that fades into the glow, like the light around an eclipse. Default: Amber',
      'amber',
      'colors',
      'glowColors'
    ),
  ],
})
