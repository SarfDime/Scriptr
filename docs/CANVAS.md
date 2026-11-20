# Canvas Backgrounds

Rules a background canvas in `next/` follows. What each canvas draws is the code's business
(the sky's own settings: [`SKYBOX.md`](SKYBOX.md)). Repo rules: [`AGENTS.md`](../AGENTS.md).

## Where the parts live

| Part                                           | Home                                                             |
| ---------------------------------------------- | ---------------------------------------------------------------- |
| Day/scene model — pure, no DOM                 | `shared/utils/` (tested beside it with `tsx --test`)             |
| Tunables and defaults                          | `shared/config/` — the Studio schema and the painters share them |
| Drawing (sprites, painters, colour helpers)    | `next/lib/app-background/`                                       |
| The component: canvases, effect, clock, stores | `next/components/ui/app-background/`                             |
| Occluder masks (what is painted in front)      | built in the component, once per layout                          |
| Theme colours                                  | `next/styles/base/*.css`, through CSS variables                  |

## Rules

1. **Paint the still parts once, into their own canvas, and blit them.** Size or theme
   change is the only repaint; per-frame scenery is the cost to avoid.
2. **One canvas per cadence.** A layer that needs a slower rate gets its own canvas, so a
   slow layer never makes a fast one wait. **Occlusion lives on the layer**: erase with
   `destination-out` and a per-layout mask; a scratch canvas copied back per object costs
   several times as much.
3. **Cap the frame rate and the DPR.** `MIN_FRAME_MS` gates the loop; DPR caps at 2, and
   1.5 on a phone (`next/lib/app-background/mobile-store.ts`).
4. **One still frame under `prefers-reduced-motion`** — no loop, repaint only when a still
   frame cannot show the change (palette, theme). `requestAnimationFrame` already stops in
   a hidden tab.
5. **Gate resize churn.** A height-only change under a fifth of the viewport is ignored and
   the bitmap stretches; a real resize defers its layout to the next frame.
6. **Do not rebuild the scene for a mode flip.** `immersive` is read from a ref, not from
   the effect's dependencies. When a dependency really changes the drawing (device type,
   DPR cap, layout), carry the clock and state in refs so the re-run continues.
7. **Measure with `?canvasStats=1`** (fps and per-part milliseconds, last second on
   `window.canvasStats`). Firefox is much more expensive than Chromium here — measure in
   the browser that is slow.
8. **Share state on a low-frequency store.** Live sky state is written at most once a second
   (`skybox-store.ts`) and read through `useSkyState()`; per-frame values stay in closures
   and refs. No per-frame React state.
9. **No allocation, DOM read or colour lookup per frame.** Resolve the palette once per
   theme change (`createColorResolver`, cached in `createSkyColorResolver`) and reuse
   sprites.
10. **Colours come from the theme**, so light, dark and immersive are data, not constants.
11. **Paint the page, not the window.** The canvases begin below the sticky header
    (`--header-height`, `--background-height` in `globals.css`) and take the whole
    viewport in immersive mode. Measure the canvas (`clientWidth`/`clientHeight`), never
    `window.inner*`, and subtract the canvas origin before hit-testing a pointer.

## Starting a new one

1. Model first: a pure function in `shared/utils/` answering "what does the scene look like
   at time t", with a test beside it.
2. Painters next in `next/lib/app-background/`: sprites built once, painters that take a
   context and the model output.
3. Component last: canvases, loop, resize and reduced-motion gates, store writes.
4. A background the website settings can pick also needs a Sanity document type, an entry
   in the union in `sanity/schemas/website.ts`, a branch in `AppBackground.tsx` and a tag in
   `shared/config/cache-tags.ts`.
5. Measure the still paint, the per-frame draw and the resize path on a mid-range phone.
