# Skybox (shared sky)

The shared sky behind every other background canvas. It owns the time of day, where
the sun and the moon are, and it is what the scenery under it is laid out around.

## Files

| File | What it does |
| --- | --- |
| `shared/types/skybox.types.ts` | `SkyState`, `SkyKeyframe`, `SkyboxConfig`. |
| `shared/config/skybox.ts` | Defaults, `SKY_ANCHORS`, the keyframe color keys, the query param names. |
| `shared/utils/skybox-model.ts` | `getSkyState(hours, config, toRGB)` — the pure day model. No DOM. |
| `shared/utils/skybox-model.test.ts` | Phase blending, sun and moon paths (`tsx --test`). |
| `next/lib/app-background/skybox-canvas.ts` | Drawing: gradient, sun and moon, stars, clouds. |
| `next/lib/app-background/skybox-store.ts` | The live `SkyState` for the other canvases (`useSkyState`). |
| `next/lib/app-background/skybox-sun.ts` | The sun: one flat disc, one flat shade and one flat highlight. |
| `next/lib/app-background/lens-flare.ts` | The immersive-only flare overlay that follows the pointer. |
| `next/components/ui/app-background/SkyboxCanvas.tsx` | The two canvases, the clock, the palette crossfade and the dev override. |
| `next/styles/base/sky-colors.module.css` | Every sky color, light and dark, plus the theme-independent `sky-original-*` set. |
| `next/styles/base/christmas-colors.module.css` | The theme-independent `christmas-original-*` set the scenery uses in immersive mode. |

## Integration

`AppBackground` mounts `SkyboxCanvas` before `ChristmasCanvas` so the sky sits
behind the scenery, and only for the Christmas background: it appears when the
website settings point at a `christmasCanvas` document. A `starCanvas` document
mounts `CustomStarCanvas` alone, and no background document leaves the static
gradient. The sky color tokens are imported from
`next/styles/base/sky-colors.module.css` by `next/styles/main.css`. The Christmas
mountains use `SKY_ANCHORS` from `shared/config/skybox.ts`, keeping the sun at the
ridge during sunrise and sunset.

## Immersive mode

Both canvases crossfade to a palette of their own once the reader enters the
full-screen view, because no page copy is on screen to stay readable.

- **The sky** blends from the themed keyframes to the `sky-original-*` set over
  1.5 s (`getSkyState(..., originalMix)`). That palette is theme-independent
  and a step less saturated than it first was; the model then deepens the night
  further the higher the moon climbs, so the middle of its cycle (midnight) is the
  darkest point (`moonDarkening` in `shared/utils/skybox-model.ts`).
- **The scenery** keeps a second scene canvas painted with
  `resolveImmersiveChristmasColors()` (`christmas-canvas.ts`), which ignores both
  the theme and the colors picked in Sanity. It is painted lazily the first time it
  is needed and faded in over the themed scene with opacity, so switching palettes
  costs no per-frame scene paint. The glows, smoke, snow and sleigh sprites follow
  whichever palette is on through `ChristmasLook` in `ChristmasCanvas.tsx`.

## Reviewing the design

- `?skyTime=06:00` pins the sky to a time of day.
- `?skyTime=06:00&skySpeed=1440` pins the start and sweeps a full day in a minute.
- `<SkyboxCanvas timeOverride='18:00' />` does the same from a component.

## The contract, in two halves

- **Static** — `SKY_ANCHORS` (`horizon`, `sunriseX`, `sunsetX`, `moonFromX/ToX`), as
viewport fractions. A canvas that paints once lays its scenery out around these.
- **Live** — `SkyState` (`phase`, `daylight`, `sun`, `moon`, `starVisibility`, the sky
tints) in `next/lib/app-background/skybox-store.ts`, read with `useSkyState()`. It is written at
most once a second, so reading the tint does not repaint a scene per frame.

## Deliberate shortcuts

- The sky canvas is repainted twice a second normally and at the effects frame cap
  while immersive. The gradient is the expensive part; if a slower device struggles,
  raise `SKY_REPAINT_MS` for the normal mode.
- The light theme's night, dusk, dawn and sunset are pale pastels instead of dark
  ones. The page's copy is dark, so a dark sky left it at about 1.2:1 against the
  background; the dark theme keeps the real night. The light theme's stars are deep
  indigo for the same reason — cream ones disappeared into the pale sky.
- The moon sits on the horizon line at midday instead of leaving the sky, because the
model keeps it inside the viewport; its opacity there is 0.08, so it is invisible.
- The sun is deliberately a cut-paper shape, not a shaded one: a flat disc with one
shade and one highlight, no rays, and a radius only a hair larger than the moon's. A
photoreal sun (limb darkening, a turning texture, a bloom) looked pasted onto the
flat scenery, and rays made it read as a cartoon rather than part of the scenery. The
soft halo around it is still the sky's, not the sun painter's.
- `scaleForMobile` takes the config as a generic so a non-Skybox caller can reuse it
without the full type; it is only used by the skybox today.
