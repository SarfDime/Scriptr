# Skybox (shared sky)

The sky behind every background canvas: time of day, sun and moon, and the anchors the
scenery below is laid out around.

## Files

| File                                                 | What it does                                                                                                  |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `shared/types/skybox.types.ts`                       | `SkyState`, `SkyKeyframe`, `SkyboxConfig`, the color palette and the Sanity data shapes.                      |
| `shared/config/skybox.ts`                            | Defaults, `SKY_ANCHORS`, `SKY_COLORS`, the color keys and roles, `applySkyColorOverrides`, query param names. |
| `shared/utils/skybox-model.ts`                       | `getSkyState(hours, config, toRGB, originalMix, palette)` — the pure day model, no DOM.                       |
| `shared/utils/skybox-model.test.ts`                  | Phase blending, sun and moon paths, picked colors (`tsx --test`).                                             |
| `sanity/schemas/misc/skybox.ts`                      | The `skybox` document: day settings, stars and clouds, and one color set per theme.                           |
| `next/lib/app-background/skybox-canvas.ts`           | Gradient, sun and moon, stars, clouds; `resolveSkyboxPalette` and `withSkyboxDefaults`.                       |
| `next/lib/app-background/canvas-primitives.ts`       | `TAU`, `WHITE`, the theme colour resolver, `mixRGB`, `luminance`, `addFalloff`.                               |
| `next/lib/app-background/mobile-store.ts`            | Device-type store (`useSyncExternalStore`).                                                                   |
| `next/lib/app-background/skybox-store.ts`            | Live `SkyState` for the other canvases (`useSkyState`).                                                       |
| `next/lib/app-background/skybox-sun.ts`              | The sun: one disc, one shade, one highlight.                                                                  |
| `next/lib/app-background/lens-flare.ts`              | Immersive-only flare that follows the pointer.                                                                |
| `next/components/ui/app-background/SkyboxCanvas.tsx` | Canvases, clock, palette crossfade, dev override.                                                             |
| `next/styles/base/sky-colors.module.css`             | Every sky colour (light and dark) plus the theme-independent `sky-original-*`.                                |
| `next/styles/base/christmas-colors.module.css`       | The theme-independent `christmas-original-*` set.                                                             |

## Integration

`AppBackground` mounts `SkyboxCanvas` before `ChristmasCanvas`, so the sky sits behind the
scenery; it appears when the website settings point at a `christmasCanvas` document, and no
background document leaves the static gradient. The website settings also point at a
`skybox` document, which the layout reads and passes to `SkyboxCanvas`; without one the sky
uses `SKYBOX_DEFAULTS` and the built-in palette. `main.css` imports `sky-colors.module.css`.
The Christmas mountains read `SKY_ANCHORS` to keep the sun on the ridge at sunrise and
sunset.

The canvases start below the sticky header (`--header-height`, `--background-height` in
`globals.css`) and measure themselves, not the window, so the sun, the moon, the stars and
Santa stay in the visible page. Immersive mode covers the whole viewport, header included.

## Settings

| What                                                                                       | Where                                                    |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| Sunrise, sunset, day speed                                                                 | `skybox` document, `day` group                           |
| Sun and moon size, stars, star size, clouds, cloud speed, phone scale                      | `skybox` document, `sky` group                           |
| Full-screen on/off, day length, speed ramp, palette crossfade, night deepening, lens flare | `skybox` document, `immersive mode` group                |
| Colors per theme                                                                           | `skybox` document, one fieldset per phase plus the stars |

A setting left empty falls back to `SKYBOX_DEFAULTS` (`withSkyboxDefaults` ignores the
`null`s Sanity returns). A color pick is a theme color key that replaces one key of that
phase, so the sky keeps following the theme; immersive mode ignores the picks and keeps the
built-in `sky-original-*` palette (`applySkyColorOverrides`).

## Immersive mode

Both canvases crossfade to their own palette once the reader enters the full-screen view.

- **Sky:** themed keyframes blend to `sky-original-*` over `immersiveFadeMs` (1.5 s by
  default; also the scenery's crossfade, passed down from `AppBackground`). The model
  deepens the night as the moon climbs by `immersiveDarkening`, so midnight is the darkest
  point (`moonDarkening`).
- **Controls:** `immersiveEnabled` gates the four-reindeer click on the scenery,
  `immersiveDayMinutes` and `immersiveRampSeconds` set the sweep and its ease-in, and
  `immersiveFlare` turns the pointer flare off. Inside full-screen a reindeer click is
  cosmetic only: it hops and sparkles, and never asks for full-screen again. Leaving full
  screen returns the sky to the visitor's clock, or resumes a pinned `skyTime` where the
  review had reached.
- **Scenery:** a second scene canvas painted with `resolveImmersiveChristmasColors()`
  (ignores theme and Sanity colours), painted lazily and faded in over the themed scene, so
  a switch costs no per-frame paint. Glows, smoke, snow and sleigh sprites follow the active
  palette through `ChristmasLook`.

## Reviewing the design

`?skyTime=06:00` pins a time; `?skyTime=06:00&skySpeed=1440` sweeps a day in a minute;
`<SkyboxCanvas timeOverride='18:00' />` does the same from a component.

## The contract

- **Static:** `SKY_ANCHORS` (`horizon`, `sunriseX`, `sunsetX`, `moonFromX/ToX`) as viewport
  fractions — a canvas that paints once lays its scenery out around them.
- **Live:** `SkyState` (`phase`, `daylight`, `sun`, `moon`, `starVisibility`, tints) read
  with `useSkyState()`, written at most once a second.

## Deliberate choices

- The sky repaints twice a second, and at the 30 fps effects cap while immersive. The
  gradient is the expensive part; raise `SKY_REPAINT_MS` if a slow device struggles.
- Stars and clouds share the effects canvas at 15 fps outside immersive mode; immersive and
  the crossfade keep the full cap.
- Any size change re-lays the sky: holding the bitmap and letting the box stretch it would
  be cheaper, but the sun and the moon are circles. The scenery canvases still ignore a
  height-only change under a fifth of the viewport.
- `immersive` is not an effect dependency — the loop reads it from a ref, so a mode flip
  never rebuilds the scene or resets the hour under the crossfade.
- The light theme's night, dusk, dawn and sunset are pale pastels (a dark sky sat at ~1.2:1
  against the page's dark copy) and its stars are deep indigo.
- The moon stays inside the viewport at midday with opacity 0.08, so it is invisible.
- The sun is cut paper: one flat disc, one shade, one highlight, no rays, radius a hair
  larger than the moon's. The halo around it belongs to the sky, not the sun painter.
- `scaleForMobile` takes the config generically so a non-skybox caller can reuse it.
