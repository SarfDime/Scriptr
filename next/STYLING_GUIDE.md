# Scriptr UI Styling Guide

The CSS in `next/styles/` is the source of truth; this guide lists its public classes.
Update it when a public utility or component class changes.

## Files

- `base/`: `breakpoints` (`--breakpoint-*`), `colors` + `colors-dark` (light palette and
  the dark retune), `semantic` (per-theme roles such as `text-fg-muted`), `shadows`
  (`shadow-sm`…`shadow-xl`), `utilities` (small globals, animations).
- `components/`: `animations`, `layout` (container, section, stack/cluster, grids),
  `typography` (`ui-display`…`ui-caption`), `surfaces` (cards, badges, sheen, `ui-above*`),
  `ice-tokens` + `ice-surfaces` (`--ice-*`, `ice-above*`), `snow-cap`, `dividers` +
  `ice-dividers`, `loading`, `button`, `color-palettes`, `portable-text`, `skeleton`,
  `toast`.

**Import order is load-bearing.** `@utility` output follows Tailwind's property order, but
plain rules keep their import order: a split moves blocks verbatim, never reorders or
alphabetises them. `no-gradient` and the `ui-sheen-*` family come after the `*-above*`
utilities, and `--ui-lit-edge` stays first in every `box-shadow` stack.

## Layout

| Class          | Use                                                  |
| -------------- | ---------------------------------------------------- |
| `ui-container` | Main content region: navbar width and overflow.      |
| `ui-section`   | Responsive block padding.                            |
| `ui-stack`     | Vertical flex; set the gap with a Tailwind `gap-*`.  |
| `ui-cluster`   | Wrapping horizontal flex; already centres its items. |

Use semantic HTML (`header`, `nav`, `main`, `section`, `footer`) — there is no `ui-nav` or
`ui-footer`. Prefer parent `ui-stack`/`ui-cluster` gaps over `mt-*`/`mb-*` between siblings.

## Typography

Size, weight and colour belong to the class; never add `font-*` or `text-<color>` beside a
`ui-*` class. Muted copy uses `text-fg-muted`, never a raw `grey-*`/`fg-*` step.

| Class            | Size            | Weight   | Colour         | Use                     |
| ---------------- | --------------- | -------- | -------------- | ----------------------- |
| `ui-display`     | 30→72px         | bold     | `fg-700`       | Large page heading      |
| `ui-heading`     | 24→48px         | bold     | `fg-700`       | Section heading         |
| `ui-title`       | 16px, 18px `md` | semibold | `fg-700`       | Section or card heading |
| `ui-subtitle`    | 14px            | normal   | `fg-muted`     | Supporting copy         |
| `ui-body`        | 16px            | normal   | `fg`           | Body copy               |
| `ui-body-strong` | 16px            | semibold | `fg`           | Entity and person names |
| `ui-label`       | 12px            | semibold | `fg-muted`     | Field labels            |
| `ui-caption`     | 12px            | normal   | `fg-muted`     | Metadata, help text     |
| `ui-nav-caption` | 12px uppercase  | normal   | `fg-on-chrome` | Nav section caption     |
| `ui-stat`        | 24px            | medium   | `fg-700`       | Numeric stat            |

Display type is bold with `tracking-tight`; never add `font-black` or
`tracking-tighter`. The responsive `font-size-*` classes belong to authored rich text
(`portable-text.module.css`), not app UI.

**Section headers** use `SectionHeader`: `title`, `subtitle`, `icon`, `count`, `actions`,
`as` (default `h2`), `titleProps`, `subtitleProps`, `iconProps`, `badgeProps`, `className`.
Subtitles render as `ui-subtitle`, never `ui-caption`.

**Skeletons** are a neutral wash (5–9% of the foreground over `background-225`, or a
lifted step of `--ice-base` on ice, 1.8s breath), never a brand colour; change them only in
`skeleton.module.css`.

## Surfaces

Prefer `Box`, `Card`, `Button`, `Badge`, `Divider`.

| Class                                                                                                | Use                                                                                                       |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `ui-card`, `ui-card-header`, `ui-card-body`, `ui-card-footer`                                        | Card frame and sections.                                                                                  |
| `ui-badge`                                                                                           | Badge radius and sizing.                                                                                  |
| `ui-above`                                                                                           | Translucent panel: 97% fill, sheen, shadow, no blur (ice adds one). Sets no border width — add `border`.  |
| `ui-above-drawer`                                                                                    | Slide-over off the right edge (notification tray): chrome volume, square, border and drop on the left.    |
| `no-gradient`                                                                                        | Drops the sheen, keeps fill/border/shadow. For dense text where the wash competes.                        |
| `ui-sheen-horizontal` (`-inverted`), `ui-sheen-vertical` (`-inverted`), `ui-sheen-diagonal-inverted` | Same band, different edge: top, bottom, left, right, bottom-right. Named for the edge, not the ramp axis. |
| `ui-divider`, `ui-divider-h`/`-v`                                                                    | Groove base; the ice ridge (`ice-divider-xs`, 8px; 2px groove in simple mode).                            |
| `ui-groove-t/b/l/r`                                                                                  | Turns the element's own border on that side into the iced edge.                                           |
| `ice-groove-none`                                                                                    | Keeps the ridge off an edge removed with `border-0`.                                                      |
| `ui-loading-overlay`, `-exiting`                                                                     | The global loading `<dialog>` and its fade-out.                                                           |

```tsx
;<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Metadata</Card.Footer>
</Card>
```

**Two layers** on script pages and dialogs: outer `ui-above rounded-xl border p-3`
(`ScriptSurface`), inner `rounded-lg border border-grey-200 ui-above-inside p-4`
(`ScriptPanel`, an `aside` unless `as='div'`). Never stack `ui-card` with a `bg-*`
override; use `ScriptPanel` or a plain `Box`.

## Surface material

- Classic surfaces are translucent, never frosted: 97% fill, no `backdrop-filter` — blur
  over the animated backdrop was the most expensive paint. Chrome (`ui-above-nav`,
  `ui-above-header`, `ui-above-drawer`, footer) is fully opaque.
- Ice is the one glass: `ice-above` is a `--ice-glass-a` fill over
  `backdrop-filter: var(--ice-backdrop)` (`blur(2px) saturate(1.4)`).
  `ice-above-inside` sits on a panel (no blur needed) and `ice-above-opaque` sets
  `backdrop-filter: none` for the chrome. Simple mode removes the material (the `ice`
  variant only matches `:root[data-surface="ice"]:not([data-simple])`).
- The only other blur is `.ui-loading-overlay`, which fades to 60% when the page is ready;
  simple mode makes it opaque.
- **`ui-sheen`** paints the light band: one gradient, `135deg` (`--ui-sheen-angle`), a fixed
  96px band (`--ui-sheen-length`, capped at 60%), strength `--ui-sheen` (default 11%) ×
  `--ui-sheen-strength` (1 light, 0.6 dark), colour `--ui-sheen-color` (white; the `cp-*`
  palettes use their hue at 18%). `ui-above`, `ui-card` and filled buttons opt in.
- **The volume ramp** is the second `background-image` layer: lit at the top
  (`--ui-ramp-light`), transparent at `--ui-ramp-mid` (45%), shaded at the foot
  (`--ui-ramp-shade`). Both ends are off by default; only the nav, header and drawer turn
  it on (less shade on the header).
- **`--ui-lit-edge`** is the 1px inner top highlight: every surface sets
  `inset 0 1px 0 var(--ui-lit-edge)` **first** in its `box-shadow` stack.
- **`--field-edge`** is the resting edge of a control that draws its border as an inset
  ring instead of a border of its own (`InputWrapper`, the calendar note fields):
  `background-400`, or `--ice-edge` at the inner layer's alpha in ice mode. Focus, valid
  and invalid states override the ring colour.
- **Snow caps** (`snow-cap`, applied by `ice-above`) use one SVG pair per theme
  (`--snow-cap-front/back-*`), with frost from `--snow-cap-frost-a`/`-tint`. A new theme
  swaps the art pair. Simple mode sets `--snow-cap-display: none`.
- Grain was prototyped and removed — at any readable opacity it dulls the surface. Do not
  re-add it without a different compositing approach.
- **Simple mode** (`:root[data-simple]`) drops every ice effect with no component change:
  no fracture/streak/ramp imagery or ice box-shadow, `--ice-edge` gives way to
  `background-300` (70% on the inner layer), panels become one flat fill (`ui-above-opaque`
  matches `ui-above`), the chrome stays one step lighter, snow caps and frost switch off,
  and dividers and grooves fall back to plain lines.
- **Chrome edges:** `ui-above-nav` uses `--shadow-edge-right`, `ui-above-header`
  `--shadow-edge-bottom`, `ui-above-drawer` `--shadow-drawer` on the left (the only chrome
  overlapping the page).

## Dividers and grooves

`ui-divider-h`/`ui-divider-v`/`ui-groove-*` are aliases at the foot of
`dividers.module.css` pointing at the ice material (`ice-dividers.module.css`) or the
classic groove (`classic-divider-*`, `classic-groove-*`): comment one block, uncomment the
other. `ui-divider` and the `--divider-line` channel stay put.

- Each groove is a **single paint**: 2px of `background-image`, first pixel the cut
  (`--divider-cut`), second the lip (`--divider-lip`). Border plus inset shadow rendered
  identical dividers at different strengths at non-100% zoom.
- Ridge art is per theme (`--ice-divider-front/back`, `-v` for vertical); a data URI
  cannot read a custom property, so a new theme needs its own art pair. The vertical art is
  a lit filament, not the horizontal ridge turned sideways: a strip a few pixels wide turns
  the icicles into full-width barbs. A vertical divider takes its height from the flex line
  (`align-self: stretch`), not `height: 100%`, which Chromium resolved to the minimum inside
  an auto-height row.
- Geometry comes from tokens (`--ice-divider-w/-h`, `-mb/-mi`, `-art/-size/-position/
  -repeat`), which is how simple mode turns the ridge into a 2px groove without
  out-ranking a utility.
- Tint with `--divider-line`, directly or through `cp-divider`; the ridge is tinted through
  `--divider-tint`, a masked copy of the art painted over it in normal blending so the
  icicles take the colour too, which `cp-divider` also sets. `cp-divider` is a utility, so
  use variants (`group-hover:cp-divider`) instead of a `-hover` sibling class.
- Both tints animate over 250ms because both are registered `<color>` `@property`s. Keep
  them that type.
- A `dashed` divider is a border: `Divider` switches the ridge off with `bg-none!` and
  `[--ice-divider-tint-a:0]`.
- `--divider-lip: transparent` collapses the groove to one crisp line.
- The art is stretched to the band, so at a fractional device height Chromium copies the
  tile's leading row to its far edge — a hairline a band away from the ridge — once the
  paint lands in a compositing ancestor's texture. `ice-divider` and `ice-groove-b::before`
  keep their own layer (`will-change: transform`) so the tile rasterizes at whole device
  pixels instead; a groove painting its art straight onto the element has no such layer.
- `ui-groove-*` needs no extra element, but the element must have no background image and
  no shadow (the lip replaces `box-shadow`). Its ridge takes `--divider-tint` through a
  masked copy in `::after`, so `cp-border` colours the cut and the art: a card footer's
  palette edge on hover is one colour, not a coloured line under an ice ridge. The bottom
  groove draws its art in `::before` so it can mirror it — the ridge bar sits on the edge
  with the lip instead of a groove-height above it.
- **`outline` is reserved for the focus ring** (2px brand at 2px offset, global
  `:focus-visible`). Never draw a border or hairline with it.

## Admin pages

`app/admin/*` pages are thin Server Components over `components/admin/`:
`AdminPageLayout` (`section` key; the root layout supplies `<main>`), `AdminNavigation`
(plain links with `aria-current`, `solid` for the current section), `AdminListStatus`
(loading/error/empty), `FlagItem`/`RestrictionItem`/`RatingTypeItem` (`ui-stack ui-above`
rows; nested groups use `ui-above-inside`), `RatingTypeForm`/`RestrictionDialog`.

- Fetching and state live in `hooks/admin/` (`useAdminList`, `useAdminErrorToast`,
  `useRestrictionForm`); components do not fetch.
- Group headings use `SectionHeader` with a `count`. Grouped cards:
  `grid grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))] items-start gap-3`.
- Pass `required` in `inputProps` only, never to `Field` (it would mark an untouched field
  invalid). Render an error outside a row that shares space with a button.
- Copy from `shared/strings/admin-strings.ts`; validation from `lib/admin-validation.ts`.

## Responsive layout

- **Wrap by space, not breakpoint:** `flex flex-wrap` with `basis-*` and `grow`. Unequal
  grow values (`grow-[100]` beside `grow`) make the main item take the free space and wrap
  first.
- Grids use `minmax(0, 1fr)` tracks, so long words cannot blow them out:
  `grid-single`, `grid-repeat-2`, `grid-repeat-3`, `grid-auto-fit` (minimum
  `--grid-min`, default `16rem`). Prefer `ui-card-grid`, `ui-card-grid-fill` (`auto-fill`)
  and `ui-grid-split` (two columns from `sm`); set `[--grid-min:22rem]` per use.
- **`content-auto`** = `content-visibility: auto` +
  `contain-intrinsic-size: auto var(--content-auto-size, 500px)`. Put it on each card of a
  long list with that card's real height (`[--content-auto-size:10rem]`); a wrong fallback
  makes the page jump. Never on a container holding `position: sticky` children, an
  anchor/scroll-spy target, or the element the canvases measure.
- **Container queries:** mark `@container`, use `@md:` on descendants. Only viewport
  breakpoints are customised; container sizes are Tailwind defaults (`@md` = 28rem). A
  container cannot size to its content, so cap it with `max-w-*`, not `w-fit`.

## Show/hide transitions

Animate with Tailwind's discrete transitions; no timers, no extra mount state, no hidden
element left in layout.

- `starting:*` — values an element animates from on first render or leaving `display: none`.
- `transition-discrete` — lets `display` flip to `none` after the exit animation.
- List `display` in the transition property (`transition-[width,opacity,display]`), plus
  `overlay` for top-layer elements.
- Give the hidden state the animated values too (`w-0 opacity-0 hidden`).
- `opacity-start` is the fade-in-only helper.
- Chrome 117+, Safari 17.4+, Firefox 129+; older browsers snap, which is fine — no JS
  polyfill.
- 200–300ms with `ease-in-out`, matched across elements that move together (navbar,
  `ui-container`, header button: 300ms). Add `motion-reduce:transition-none` for large
  motion.

## Gotchas

- **Button size:** `button` is 16px `px-5 py-2`; `button-sm` is 12px `px-2 py-1`. Defaults
  sit in the components layer, so any utility (`text-sm`, `p-2`) overrides them. Variants
  never set size.
- **Sanity icons** are globally 1.5rem (`[data-sanity-icon]:not(.overwrite)`); use
  `className='overwrite size-5'` for smaller.
- **Palette borders:** `cp-*` without `-nb` includes a 1px border, clipped by a parent with
  `overflow-hidden rounded-*` — round the element itself.
- **The `background` shorthand wipes `ui-sheen`** (it is a `background-image`). Use
  `background-color`, set before the utility.
- **`NextImage`** puts `className` on its skeleton wrapper, not the `<img>`. Use
  `objectFitProp='cover'` (default contain), and pick `sizes` from `IMAGE_SIZES`.
- **`Dialog`** styles itself with inline Tailwind merged through `cn` (no `.dialog` CSS).
  Below `md` a centred dialog is full-screen, square, borderless and scrolls inside; from
  `md` it is a framed `ui-above` card with `md:min-w-2xl`. Padding lives on the header
  (default bar with a bottom border) and on your content (`p-5`). Override only what
  differs, through `dialogProps.className`, `headerProps.className`,
  `titleProps.className`. Side trays (`placement='left' | 'right'`) get none of these.
  The veil is the dialog's `::backdrop` (`backdrop:` utilities), never a sibling element:
  only the top layer paints over a dialog that is already open.

## Buttons

`button` plus `button-sm`/`button-md`, then one variant: `solid` (primary), `ghost`
(hover surface), `link` (text, no padding, inherits size), `basic` (low-emphasis text),
`inverted` (light surface, brand text), `subtle` (muted fill; default secondary),
`success`, `warning`, `danger`.

```tsx
<Button className='button solid'>Save</Button>
<Button className='button subtle'>Cancel</Button>
<Button className='button button-sm danger'>Delete</Button>
```

Icon-only controls need an `aria-label`. `subtle` is material-switchable like the surfaces:
it points at `ice-subtle` (`classic-subtle` is kept, commented out, beside it).

**The filled recipe** (`solid`, `success`, `warning`, `danger`, pressed
`[data-active='true']`): `color-mix(--button-bg 85%, --button-lit --button-sheen)` →
`--button-bg`.

- `--button-sheen` is the highlight share (45% light / 30% dark); `--button-lit` is the
  light added to the fill, not the ink. It defaults to white, so a variant whose fill flips
  with the theme (`solid`) sets `var(--color-background-50)`.
- Ink follows the fill, not the theme (`danger` uses
  `color-mix(--color-error-red 20%, black)`); only `solid` flips.
- Hover changes the fill, never the opacity: both layers read `--button-fill`, which moves
  to `--button-bg-hover`, and the control lifts 2px into `--shadow-button-hover`.
  `--button-hover-lit` defaults to white; `solid` sets `var(--color-background-1000)`.
- `classic-subtle` keeps a 7–8% sheen plus a bevel (`inset 0 1px 0 white 24%` /
  `inset 0 -1px 0 black 10%`, scaled by `--ui-sheen-strength`).
- Simple mode swaps `--ice-subtle-fill/-ink/-paint/-shadow` on
  `:root[data-simple] .subtle`; `ice-subtle` is a 90% `--ice-base` chip with the
  `--ice-sheen-a` corner light, `--ice-edge` ring, `--ice-rim-a` top rim and `--ice-depth`
  foot shade; ink is `fg-700`, hover mixes 15% toward `--color-background-1000`.
  `ui-above-inside` reuses that recipe at panel size.
- **Disabled:** `opacity: .55` with `filter: grayscale(1)`. A container that borrows
  `.button` for look (the `Select` wrapper) is a `div` and never matches `:disabled`, so
  `Box` adds `data-disabled` and the same rule covers `[data-disabled="true"]` — pass
  `disabled` to its `Box` rather than dimming by hand.

## Shadows

Crisp and directional: a 1px contact line plus a tight drop (blur ≤10px; larger steps use
negative spread). No zero-offset glows or blur above ~12px.

| Token / class                              | Use                            |
| ------------------------------------------ | ------------------------------ |
| `shadow-sm`                                | Cards, avatars, quiet buttons  |
| `shadow-md` (`shadow-mdx`)                 | `ui-above`, toasts, dropdowns  |
| `shadow-lg`                                | Dialogs                        |
| `shadow-xl`                                | Select lists, popovers         |
| `--shadow-button`, `--shadow-button-hover` | Filled buttons at rest / hover |

Tailwind's `shadow-sm/md/lg/xl` are overridden to this scale. `--shadow-strength`
(1 light, 1.8 dark, 0.7 simple) scales every alpha. Edit `shadows.module.css`; never
hardcode a `box-shadow` in a component.

## Colours and palettes

Use the tokens in `colors.module.css`. Palettes: `cp-brand`, `cp-red`, `cp-green`,
`cp-blue`, `cp-gray`, `cp-yellow`, `cp-rose`, `cp-sky`, `cp-amber`, `cp-success`,
`cp-warning`, `cp-danger`, `cp-unstyled`. Each has `-nb` (no border) and `-int`
(interactive: pointer and hover fill).

- `cp-vars` makes a palette define variables without painting; `cp-border` and `cp-text`
  paint one part from them and take variants (`hover:cp-border`, `group-hover:cp-text`).
- `cp-success`/`warning`/`danger` alias `cp-green`/`yellow`/`red`. Palette text is the hue
  mixed toward `fg-1000`; never hardcode a hue as text on a palette.
- Palettes are driven by `--cp-hue`, `--cp-bg`, `--cp-border`, `--cp-hover`, `--cp-ink`:
  adding one means a variable rule plus its three names in the shared lists of
  `color-palettes.module.css`, never a copied block.
- Palette surfaces carry the sheen in their own hue (`--ui-sheen: 18%`,
  `--ui-sheen-color: var(--cp-hue)`). Contrast was checked at that corner (worst case 5.19:1
  vs 6.20:1 flat); re-check before raising `--ui-sheen`.

**Scale quirks:** `fg-*` and `grey-*` are not monotonic (`fg-400` lighter than `fg-350`)
and flip in dark mode. Use `text-fg-muted` for secondary text. Chrome text uses
`--color-fg-on-chrome` (`fg-650` light, `fg-500` dark), because `fg-muted` drops to 3.4:1
on the light ice; `ui-nav-caption` already carries it, and `ui-large-caption` item titles
add `text-fg-on-chrome` at the call site.

**Simple mode** (`data-simple` on `<html>`) drops transparency, the star canvas and the
gradients. Two compensating knobs on `:root[data-simple]` in `semantic.module.css`:
`--color-fg-muted` steps to `fg-450` (`fg-500` light) and `--shadow-strength` to 0.7.
Keep both together or the surface goes washed out.

## Rules for new UI

- Reuse components and utilities before adding CSS; never invent a class absent from
  `styles/`.
- Animate show/hide with `starting:` and `transition-discrete`, not an instant `display`
  flip when the change shifts layout.
- Keep layouts responsive with flex, grid, container and gap utilities; keep focus states
  and labels on every interactive control.
- Repeated framed content goes in `Card`; page sections stay unframed.
- Validate with `corepack pnpm --filter scriptr-next check-types` and
  `corepack pnpm format` (Biome is the linter; no separate lint step).
