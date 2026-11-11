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
| `next/components/ui/app-background/SkyboxCanvas.tsx` | The two canvases, the clock and the dev override. |
| `next/styles/base/sky-colors.module.css` | Every sky color, light and dark. |

## Integration

`AppBackground` mounts `SkyboxCanvas` before `ChristmasCanvas` so the sky sits
behind the scenery, and only for the Christmas background: it appears when the
website settings point at a `christmasCanvas` document. A `starCanvas` document
mounts `CustomStarCanvas` alone, and no background document leaves the static
gradient. The sky color tokens are imported from
`next/styles/base/sky-colors.module.css` by `next/styles/main.css`. The Christmas
mountains use `SKY_ANCHORS` from `shared/config/skybox.ts`, keeping the sun at the
ridge during sunrise and sunset.

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
- The moon sits on the horizon line at midday instead of leaving the sky, because the
model keeps it inside the viewport; its opacity there is 0.08, so it is invisible.
- `scaleForMobile` takes the config as a generic so a non-Skybox caller can reuse it
without the full type; it is only used by the skybox today.
