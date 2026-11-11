# Scriptr UI Styling Guide

This guide describes the styling primitives currently defined in `next/styles/`
(paths below are relative to `next/`). The CSS files are the source of truth; update this guide when a public utility
or component class changes.

## Files

- `styles/main.css`: Tailwind entry point and stylesheet imports.
- `styles/base/breakpoints.module.css`: viewport breakpoints (`--breakpoint-*`).
- `styles/base/colors.module.css`: theme and color tokens (the light palette).
- `styles/base/colors-dark.module.css`: the same scales retuned for dark mode, by preference and by `data-theme="dark"`.
- `styles/base/semantic.module.css`: role-based tokens that resolve per theme (`text-fg-muted`).
- `styles/base/shadows.module.css`: elevation tokens (`shadow-sm` to `shadow-xl`, button shadows).
- `styles/base/utilities.module.css`: small global utilities and animations.
- `styles/components/animations.module.css`: entry animations, the selection colour and the simple-mode motion clamp.
- `styles/components/layout.module.css`: container, section padding, stack/cluster and the grid utilities.
- `styles/components/typography.module.css`: the `ui-display` … `ui-caption` type scale.
- `styles/components/surfaces.module.css`: cards, badges, the sheen, the `ui-above*` panels and the simple-mode surface overrides.
- `styles/components/dividers.module.css`: `ui-divider` and the `ui-groove-*` helpers.
- `styles/components/loading.module.css`: the loading overlay and its veil.
- `styles/components/button.module.css`: button base and variants.
- `styles/components/color-palettes.module.css`: badge color classes.
- `styles/components/portable-text.module.css`: authored rich-text styles, including the responsive `font-size-*` classes.
- `styles/components/skeleton.module.css`: skeleton loading wash.
- `styles/components/toast.module.css`: toast styles.

**The import order is load-bearing.** `@utility` definitions are emitted in
Tailwind's own property order, so one can move between files without changing
which of two utilities wins; the plain rules (theme variables, the simple-mode
overrides, the loading overlay) keep the source order they are imported in, so a
split moves blocks verbatim and never reorders or alphabetises them. Several
utilities still depend on the emitted order: `no-gradient` and the `ui-sheen-*`
family come after the `*-above*` utilities, and `--ui-lit-edge` stays first in
every `box-shadow` stack (see [Surface detail](#surface-detail)).

## Layout

Use these utilities for structure:

| Class          | Use                                                                       |
| -------------- | ------------------------------------------------------------------------- |
| `ui-container` | Main content region with navigation width and overflow behavior.          |
| `ui-section`   | Responsive block padding.                                                 |
| `ui-stack`     | Vertical flex layout. Set the gap with a Tailwind gap utility.            |
| `ui-cluster`   | Wrapping horizontal flex layout. Set the gap with a Tailwind gap utility. |

Prefer semantic HTML with these utilities:

```tsx
<header className='ui-section'>
  <div className='ui-container ui-stack gap-3'>
    <h1>Page title</h1>
    <p>Supporting text</p>
  </div>
</header>
```

Use `ui-stack` for vertical content and `ui-cluster` for actions, links, tags,
and other horizontal groups. Use `nav`, `header`, `main`, `section`, and
`footer` for meaning; there are no dedicated `ui-nav`, `ui-item`, or
`ui-footer` classes.

## Typography

Use semantic typography utilities instead of repeating raw font-size and color
classes. Size, weight and color belong to the class; do not add `font-*` or
`text-<color>` utilities next to a `ui-*` class. For muted body copy use
`text-fg-muted`, never a raw `grey-*`/`fg-*` step (those scales are not
monotonic and flip in dark mode).

| Class            | Size            | Weight   | Color      | Use                          |
| ---------------- | --------------- | -------- | ---------- | ---------------------------- |
| `ui-display`     | 30px to 72px    | bold     | `fg-700`   | Large page heading.          |
| `ui-heading`     | 24px to 48px    | bold     | `fg-700`   | Section heading under a page title. |
| `ui-title`       | 16px, 18px `md` | semibold | `fg-700`   | Section or card heading.     |
| `ui-subtitle`    | 14px            | normal   | `fg-muted` | Supporting copy.             |
| `ui-body`        | 16px            | normal   | `fg`       | Standard body copy.          |
| `ui-body-strong` | 16px            | semibold | `fg`       | Entity and person names.     |
| `ui-label`       | 12px            | semibold | `fg-muted` | Field labels, names.         |
| `ui-caption`     | 12px            | normal   | `fg-muted` | Metadata, help text.         |
| `ui-stat`        | 24px            | medium   | `fg-700`   | Numeric activity/stat value. |

The responsive `font-size-*` classes belong to authored rich text
(`portable-text.module.css`); do not use them in app UI. They no longer set a
color, and rich text rendered inside a `ui-display` / `ui-title` heading
inherits the heading's color instead of the body `text-fg`.

Display type is bold with `tracking-tight`: the black cut with tighter
tracking made letters touch. Do not add `font-black` or `tracking-tighter` to
headings.

Prefer parent `ui-stack` or `ui-cluster` gaps over `mt-*` and `mb-*` spacing
between sibling elements.

### Section headers

Use `SectionHeader` (`components/common/SectionHeader.tsx`) for every section
heading instead of hand-building a `ui-title` + badge + caption row:

```tsx
<SectionHeader title='Files' count={files.length} />
<SectionHeader title='Your subjects' subtitle='Complete your study setup.' />
<SectionHeader
  title='Comments'
  count={3}
  icon={CommentIcon}
  actions={<Button className='button solid'>Write</Button>}
  titleProps={{ id: headingId }}
/>
```

Props: `title`, `subtitle`, `icon`, `count`, `actions`, `as` (heading level,
default `h2`), plus `titleProps`, `subtitleProps`, `iconProps`, `badgeProps`
and `className`. Subtitles render as `ui-subtitle` (14px), never as
`ui-caption` (12px).

### Skeletons

Skeletons are a quiet neutral wash (5% to 9% of the foreground color over the
background, breathing over 1.8s), not a brand color. Change them only in
`skeleton.module.css`.

## Surfaces and content

The preferred component APIs are `Box`, `Card`, `Button`, `Badge`, and
`Divider`.

| Class                           | Use                                                                                                                                                                           |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ui-card`                       | Framed surface. Prefer the `Card` component.                                                                                                                                  |
| `ui-card-header`                | Card heading section.                                                                                                                                                         |
| `ui-card-body`                  | Main card content.                                                                                                                                                            |
| `ui-card-footer`                | Card footer with a top border.                                                                                                                                                |
| `ui-badge`                      | Shared radius and sizing behavior for badges.                                                                                                                                 |
| `ui-above`                      | Translucent panel: 97% fill, sheen and shadow, no backdrop blur. Sets no border width; add `border`.                                                                          |                                                                                            
| `ui-above-drawer`               | Slide-over off the right edge (the notification tray): the chrome volume, square, with its border and drop on the leading (left) side.                                        |
| `no-gradient`                   | Drops the sheen from any surface that keeps its fill, border and shadow: `ui-above no-gradient`, `ui-above-inside no-gradient`. For panels carrying dense text, where the wash competed with it. |
| `ui-sheen-horizontal` and friends | Moves the sheen band, keeping its colour, strength and length: `ui-sheen-horizontal` (top edge, fades down), `ui-sheen-horizontal-inverted` (bottom edge, fades up), `ui-sheen-vertical` (left edge, fades right), `ui-sheen-vertical-inverted` (right edge, fades left), `ui-sheen-diagonal-inverted` (bottom-right corner). Named for the edge the band lies along, not the axis the ramp runs on. |
| `ui-divider`                    | Base for `Divider`: paints the groove line and uses no border.                                                                                                                |
| `ui-divider-h` / `ui-divider-v` | The groove itself, horizontal or vertical (2px).                                                                                                                              |
| `ui-groove-t/b/l/r`             | Turns an element's own border on that side into the same groove.                                                                                                              |
| `ui-loading-overlay`            | The global loading screen's modal `<dialog>`: fills the viewport, near-opaque veil, fades in and out. Not for other overlays.                                                 |
| `ui-loading-overlay-exiting`    | Added alongside `ui-loading-overlay` for the fade-out, just before the dialog is closed.                                                                                      |

```tsx
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Metadata</Card.Footer>
</Card>
```

## Layered surfaces

Content on the script pages and in dialogs sits on two layers: an outer
translucent surface and, inside it, a lighter fill where the text is shown.

| Layer | Classes                                                 | Component       |
| ----- | ------------------------------------------------------- | --------------- |
| Outer | `ui-above rounded-xl border p-3`                        | `ScriptSurface` |
| Inner | `rounded-lg border border-grey-200 ui-above-inside p-4` | `ScriptPanel`   |

`ScriptPanel` renders an `aside` by default; pass `as='div'` for non-landmark
content such as file cards. Do not put `ui-card` and a `bg-*` utility on one
element to override its fill; use `ScriptPanel` or a plain `Box`.

## Surface detail

Surfaces are translucent fills, never frosted: there is no `backdrop-filter`
anywhere in the app, because blurring an animated backdrop was the most
expensive paint on the page. `ui-above` and its variants sit at 97% opacity, so
the page behind shows only as a faint tint, without needing a blur to stay
legible. The chrome (`ui-above-nav`, `ui-above-header`, `ui-above-drawer`, the
footer) is fully opaque instead — it frames the page, and there is nothing
behind it to tint.

Three utilities give the surfaces their material. All three are opt-in through
the surfaces themselves, so a component that already uses `ui-above`, `ui-card`
or a filled button needs no extra class.

- **`ui-sheen`** paints a light-to-nothing band across the top left of the
  element, so the pane catches light like a bevel. It is one gradient, `135deg`
  by default (`--ui-sheen-angle`), with a **fixed 96px band** (`--ui-sheen-length`, capped at 60% of the
  box). Percentage-sized ramps were tried and reverted: on a tall panel the band
  covered the whole element and read as a flat wash. Strength comes from
  `--ui-sheen` (per component, default 11%) multiplied by `--ui-sheen-strength`
  (per theme: 1 light, 0.6 dark), so one knob dims every sheen in dark mode, and
  the colour comes from `--ui-sheen-color` (white by default). The `cp-*`
  palettes set it to their own hue at 18%: white is invisible on a chip that is
  near-white already, while a hue wash reads in both themes.
- **The volume ramp** is the second `background-image` layer inside `ui-sheen`.
  Because the band only reaches 96px into a box, a tall surface was one tone from
  there down; the ramp runs the whole height instead — lit at the top
  (`--ui-ramp-light`), transparent at `--ui-ramp-mid` (45% by default) and
  settling into shade at the foot (`--ui-ramp-shade`). Both ends are **off by
  default**, so panels keep just the band: `ui-above-nav`, `ui-above-header` and
  `ui-above-drawer` turn it on, the 64px header with less shade so the ramp does
  not compress into a stripe. Both ends weaken with `--ui-sheen-strength`, like
  the band, and `no-gradient` removes the layer with the rest.
- **`no-gradient`** removes that sheen while keeping everything else the surface
  paints. It is declared after every `*-above*` utility, so plain source order
  settles the conflict — write it in any position in the class list. Use it for
  a panel with dense text where the band sits under the copy.
- **`ui-sheen-horizontal`** and its siblings keep the same band, colour,
  strength and length and only turn the direction. The name is the edge the
  band lies along rather than the axis the ramp runs on, because that is what
  you see: `ui-sheen-horizontal` puts the band along the top edge and fades
  down (`to bottom`), `ui-sheen-horizontal-inverted` along the bottom edge
  (`to top`), `ui-sheen-vertical` along the left edge (`to right`),
  `ui-sheen-vertical-inverted` along the right edge (`to left`), and
  `ui-sheen-diagonal-inverted` comes out of the bottom-right corner (`315deg`,
  the mirror of the `135deg` default). Each `@apply ui-sheen`s, so it also works
  on an element with no surface class of its own, and each is declared after the
  `*-above*` utilities for the same source-order reason as `no-gradient`. The
  direction is a knob (`--ui-sheen-angle`); the band's falloff is not — every
  surface catches the same light. Anything else is a variant on a call site:
  `[--ui-sheen-angle:200deg]`, no new class.
- **`--ui-lit-edge`** is the 1px inner highlight along the top edge. Every
  surface sets `inset 0 1px 0 var(--ui-lit-edge)` **first** in its `box-shadow`
  stack; keep that order or a later shadow paints over the light.
- **Grain** (a tiled noise overlay) was prototyped and removed: at any opacity
  that reads as texture it also dulls the surface to a flat tone. Do not re-add
  it without a different compositing approach.

### Chrome edges

The frame pieces are square and flat-edged, so their separation comes from the
side they meet the page on:

- `ui-above-nav` (docked navbar) — border and `--shadow-edge-right`.
- `ui-above-header` — border and `--shadow-edge-bottom`.
- `ui-above-drawer` (the notification tray) — border and `--shadow-drawer` on
  the **left**. It is the only chrome that overlaps the page rather than framing
  it, so its drop is the one soft layer deeper than the fixed edges; its leading
  1px is `inset` with `--ui-lit-edge`, like every other lit edge.

### Dividers and grooves

A divider is a **single paint**: `2px` of `background-image` where the first
1px is the cut (`--divider-cut`) and the second is the lip (`--divider-lip`).
Drawing the cut as a border and the lip as an inset shadow was the earlier
version and made identical dividers render at different strengths — the two
layers snapped to device rows independently, which is visible at any non-100%
zoom.

- Tint a divider by setting `--divider-line`, either directly
  (`[--divider-line:var(--color-grey-500)]`) or through the `cp-divider` helper,
  which derives the same colour a palette uses for its border. A palette class
  on a divider contributes only its hue: `color-palettes.module.css` excludes
  `.ui-divider` from the palette surface and border rules.
- `cp-divider` is a Tailwind utility, so it takes variants like any other
  (`group-hover:cp-divider`, `peer-checked:cp-divider`). Tint it conditionally
  with a variant rather than adding a `-hover`/`-active` sibling class — the
  trigger then belongs to the call site, not the palette file.
- The tint fades: `ui-divider` transitions `--divider-line` over 200ms
  `ease-in-out`. That only works because the variable is registered as a
  `<color>` (`@property` in `dividers.module.css`) — an unregistered property
  is discrete and a gradient built from it would jump. Keep divider tints
  inside that type.
- `ui-groove-t/b/l/r` gives any element that already separates itself with a
  border (card footer, dialog header) the same groove, so it does not need to
  become a `Divider`. Only for elements that carry no shadow of their own — the
  groove is a shadow, so the two would fight.
- `--divider-lip: transparent` collapses the groove to a single crisp line.
- **`outline` is reserved for the focus ring** (a global `:focus-visible` rule in
  `utilities.module.css` draws 2px of brand at 2px offset). Never draw a border
  or a hairline with `outline`; `hollow` and `subtle` use inset `box-shadow`
  rings for exactly this reason.

## Admin pages

The admin pages (`app/admin/*`) are thin Server Components. They share one
frame and one set of building blocks in `components/admin/`:

| Piece | Use |
| ----- | --- |
| `AdminPageLayout` | Wraps every admin page: `PageLayout` header (admin title plus section label) and `AdminNavigation`. Takes the `section` key. The root layout already supplies `<main>`. |
| `AdminNavigation` | Plain links with `aria-current`; the current section is `solid`, the others `subtle`. The section lives in the URL, so no client state. |
| `AdminListStatus` | The loading (three `Skeleton`s), error (retry) and empty states of a list; rows render as `children` only when there is something to show. |
| `FlagItem`, `RestrictionItem`, `RatingTypeItem` | One row each, as `ui-stack ui-above`. Nested groups of fields or actions inside a row use `ui-above-inside`. |
| `RatingTypeForm`, `RestrictionDialog` | Forms built from `FormContainer`, `Field`/`InputWrapper` and `Card.Footer`. |

Rules specific to admin UI:

- Fetching and state live in hooks under `hooks/admin/` (`useAdminList`,
  `useAdminErrorToast`, `useRestrictionForm`); components don't fetch.
- Group headings use `SectionHeader` with a `count`. Grouped cards sit in a
  wrapping grid: `grid grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))] items-start gap-3`.
- Pass `required` only in `inputProps`, never to `Field`. `Field` marks itself
  invalid when `required` is set and it is not yet valid, so an untouched
  field would show as an error.
- Render a field's error outside the row it shares with a button; an error
  inside the field makes it taller and shifts the button.
- Strings come from `shared/strings/admin-strings.ts`; validation helpers from
  `lib/admin-validation.ts`.

## Responsive layout

- **Wrap by space, not by breakpoint.** Use `flex flex-wrap` with a `basis-*`
  and `grow` per item. Unequal grow values (e.g. `grow-[100]` next to `grow`)
  make the main item take the free space and be the one that wraps first. For
  card grids use `grid-auto-fit` (below) instead of a hand-written
  `grid-cols-[repeat(auto-fit,...)]`.
- **Grid utilities** (`styles/base/utilities.module.css`). They use
  `minmax(0, 1fr)` tracks so long words, URLs and tables cannot blow the grid
  out, and they work with variants:

  | Class           | Columns                                                      |
  | --------------- | ------------------------------------------------------------ |
  | `grid-single`   | 1                                                            |
  | `grid-repeat-2` | 2                                                            |
  | `grid-repeat-3` | 3                                                            |
  | `grid-auto-fit` | As many as fit, each at least `--grid-min` (default `16rem`) |

  ```tsx
  <div className='grid-single gap-4 md:grid-repeat-2 lg:grid-repeat-3' />
  <div className='grid-auto-fit gap-4 [--grid-min:12rem]' />
  ```

  Prefer the component utilities in `layout.module.css` for the common cases:

  | Class                | Behaviour                                                              |
  | -------------------- | ---------------------------------------------------------------------- |
  | `ui-card-grid`       | `grid-auto-fit` with a standard gap; few cards stretch across the row  |
  | `ui-card-grid-fill`  | Like `ui-card-grid`, but cards keep column width (`auto-fill`)         |
  | `ui-grid-split`      | One column, two from the `sm` breakpoint                               |

  Set the minimum card width with `[--grid-min:22rem]`. `ui-cluster`
  already centres its items, so don't add `items-center`.
- **Container queries** are built into Tailwind v4: mark the element
  `@container` and use `@md:` and friends on its descendants, so the layout
  follows the element's own width. Only viewport breakpoints are customized
  (`breakpoints.module.css`); container sizes are Tailwind's defaults (`@md` =
  28rem). An `@container` element cannot size itself to its content (it uses
  inline-size containment), so cap it with `max-w-*` instead of `w-fit`.

## Show/hide transitions

Anything that appears or disappears (a collapsing header control, drawer,
menu, popover, toast) should animate with Tailwind's discrete-transition
utilities instead of popping in and out. Do not drive this with timers or
extra mount/unmount state, and do not leave a hidden element in layout just to
fade it.

- `starting:*` (`@starting-style`): the values an element animates *from* the
  first time it renders or when it leaves `display: none`. This is the enter
  animation.
- `transition-discrete` (`transition-behavior: allow-discrete`): lets discrete
  properties transition, so `display` flips to `none` only after the exit
  animation ends (and flips back at the start of the enter animation).
- List `display` in the transition property (`transition-[width,opacity,display]`).
  For top-layer elements (`dialog`, popovers) also list `overlay`.
- Give the hidden state the animated values as well as `hidden`
  (`w-0 opacity-0 hidden`); with `starting:` carrying the same values for the
  way back in, one set of classes animates both directions.

```tsx
// Header menu button: visible below lg, hidden while the navbar is docked.
<Box
  className={cn(
    'w-10 shrink-0 overflow-hidden opacity-100',
    'transition-[width,opacity,display] transition-discrete duration-300 ease-in-out',
    'starting:w-0 starting:opacity-0',
    'lg:group-data-[nav-collapsed=false]/nav:hidden',
    'lg:group-data-[nav-collapsed=false]/nav:w-0',
    'lg:group-data-[nav-collapsed=false]/nav:opacity-0'
  )}
/>
```

Notes:

- A fade-in only (no exit animation) can use the existing `opacity-start`
  helper, which is `starting:opacity-0` plus a 300ms opacity transition.
- Support: Chrome 117+, Safari 17.4+, Firefox 129+. Older browsers skip the
  animation and show or hide instantly, which is an acceptable fallback; do not
  add JavaScript to polyfill it.
- Keep durations around 200 to 300ms with `ease-in-out`, and match them when
  several elements move together (the navbar, `ui-container` and the header
  button all use 300ms). Add `motion-reduce:transition-none` where the motion
  is large.

## Gotchas

- **Button size.** `button` defaults to 16px with `px-5 py-2`; `button button-sm`
  gives 12px with `px-2 py-1`. These defaults live in the components layer, so
  any utility on the element (`text-sm`, `p-2`, `px-3`) overrides them without
  `!`. Variants never set size.
- **Sanity icons** get a global 1.5rem size (`[data-sanity-icon]:not(.overwrite)`).
  For a smaller icon use `className='overwrite size-5'`.
- **Palette borders.** `cp-*` classes without `-nb` include a 1px border. Under
  a parent with `overflow-hidden rounded-*` the border's corners are clipped;
  round the element itself.
- **`background` shorthand wipes the sheen.** `ui-sheen` is a
  `background-image`, so setting `background:` on the same element (or a
  shorthand later in the cascade) removes it. Use `background-color`
  (and keep it before the utility) instead.
- **`NextImage`** applies `className` to its skeleton wrapper, not the `<img>`.
  Use `objectFitProp='cover'` to crop (the default is contain) and pass `sizes`.
  Always select `sizes` from the shared `IMAGE_SIZES` registry.
- **`Dialog`** styles itself with inline Tailwind merged with `cn` (there is no
  `.dialog` CSS). A centered dialog (the default) fills the screen below `md`:
  square, borderless, scrolling inside. From `md` up it is a framed
  `ui-above` card with `md:min-w-2xl`. The padding is on the header (a
  default bar with a bottom border) and on your content (give it `p-5`), not on
  the dialog. Only override what differs, through `dialogProps.className`,
  `headerProps.className` and `titleProps.className` (later classes win), e.g.
  `md:w-[min(28rem,calc(100vw-2rem))] md:min-w-0` for a narrower dialog. Side
  trays (`placement='left' | 'right'`) get none of these defaults.

## Buttons

The base utility is `button`; add `button-sm` for compact buttons, add `button-md` for medium buttons. Variants:

- `button solid`: primary action.
- `button hollow`: outlined brand action.
- `button ghost`: transparent low-emphasis action with a hover surface.
- `button link`: text link action with no button padding (inherits font size).
- `button basic`: low-emphasis text action.
- `button inverted`: light surface with brand text.
- `button subtle`: muted filled action (the default secondary).
- `button success`: positive action.
- `button warning`: attention action (dark ink on yellow).
- `button danger`: destructive action.

```tsx
<Button className='button solid'>Save</Button>
<Button className='button subtle'>Cancel</Button>
<Button className='button danger'>Delete</Button>
<Button className='button button-sm subtle'>Compact</Button>
```

Use an icon and an accessible `aria-label` for icon-only controls. Use text
when the action is not obvious from a familiar icon.

### The filled recipe

`solid`, `success`, `warning`, `danger`, `inverted`, `subtle` and the pressed
`[data-active='true']` state share one gradient:
`color-mix(--button-bg 85%, --button-lit --button-sheen) → --button-bg`.

- `--button-bg` is the variant's fill and `--button-sheen` its highlight share
  (45% light / 30% dark); the `--button-lit` colour is the *light* added to the
  fill, not the ink.
- `--button-lit` defaults to white. A variant whose fill flips with the theme
  (like `solid`, which is dark in light mode and light in dark mode) must set it
  to `var(--color-background-50)`, or the "light" mixed into a light fill turns
  the top of the button into a grey wash.
- Ink follows the fill, never the theme: `danger` uses
  `color-mix(--color-error-red 20%, black)` so it stays dark on the red fill in
  both themes. Only `solid` takes an ink that flips.
- `hollow` and `subtle` are not flat: they keep a 7-8% sheen plus a bevel
  (`inset 0 1px 0 white 24%` / `inset 0 -1px 0 black 10%`, both scaled by
  `--ui-sheen-strength`).

**Disabled.** `:disabled` renders a control at `opacity: .55` with
`filter: grayscale(1)`. A container that only borrows `.button` for its look —
the `Select` wrapper — is a `div` and never matches `:disabled`, so it would
keep its full-strength surface while the trigger inside faded; `Box` marks it
with `data-disabled` and the same rule covers `[data-disabled="true"]`. Any new
button-styled container gets that treatment by passing `disabled` to its `Box`,
not by adding its own dimming.

## Shadows

Shadows are crisp and directional: a 1px contact line plus a short, tight drop
(blur 10px or less; the larger steps use negative spread so no halo spreads
past the edge). Do not add zero-offset glows or blur above about 12px.

| Token / class              | Use                                             |
| -------------------------- | ----------------------------------------------- |
| `shadow-sm`                | Cards, avatars, resting quiet buttons.          |
| `shadow-md` (`shadow-mdx`) | `ui-above` surfaces, toasts, dropdowns.        |
| `shadow-lg`                | Dialogs and modals.                             |
| `shadow-xl`                | Select lists and popovers.                      |
| `--shadow-button`          | Filled buttons at rest (highlight + hard edge). |
| `--shadow-button-hover`    | Filled buttons on hover (1px lift).             |

Tailwind's defaults for `shadow-sm/md/lg/xl` are overridden, so the built-in
class names follow this scale. `--shadow-strength` (`semantic.module.css`) is
1 in light mode and 1.8 in dark mode and scales every alpha, so the same
tokens stay visible on dark surfaces; simple mode sets it to 0.7, where the
background gradients are gone and the same shadows overpower the page. Change the look of the whole site by
editing `shadows.module.css`; do not hardcode `box-shadow` values in
components.

## Colors and palettes

Use the theme tokens from `styles/base/colors.module.css` instead of adding
one-off colors. Current surface palettes are:

- `cp-brand`
- `cp-red`
- `cp-green`
- `cp-blue`
- `cp-gray`
- `cp-yellow`
- `cp-rose`
- `cp-sky`
- `cp-amber`
- `cp-success`
- `cp-warning`
- `cp-danger`
- `cp-unstyled`

```tsx
<Card className='cp-success'>Saved successfully</Card>
```

Use the same `cp-*` classes for cards, badges, and other palette-aware
components. `cp-unstyled` removes the palette background and text color.

Each palette also has two variants: `-nb` (no border) and `-int` (interactive:
pointer cursor and a hover fill), e.g. `cp-warning-int` for the Report script
button.

`cp-success`, `cp-warning` and `cp-danger` are aliases of `cp-green`,
`cp-yellow` and `cp-red`. Palette text is the hue mixed toward `fg-1000`
(dark in light mode, light in dark mode), so it stays readable on its own
surface in both themes; never hardcode a hue as text color on a palette.

Palettes are driven by variables (`--cp-hue`, `--cp-bg`, `--cp-border`,
`--cp-hover`, `--cp-ink`). To add one, add a variable rule and its three names
to the shared lists in `color-palettes.module.css`; do not copy a rule block.

Every palette surface also carries the sheen in its own hue (`--ui-sheen: 18%`,
`--ui-sheen-color: var(--cp-hue)`), which is strongest at the top left — the
corner chip text sits in. Contrast was checked there, not on the flat fill: the
worst case (blue and brand in light mode) is 5.19:1 against 6.20:1 on the flat
fill, so palette ink keeps its margin. Do not raise `--ui-sheen` without
re-checking that corner.

### Known color-scale quirks

The `fg-*` and `grey-*` scales are not monotonic (for example `fg-400` is
lighter than `fg-350`, and `grey-200` is lighter than `grey-150`) and they flip
direction in dark mode. Reordering them would shift colors across the app, so
they are left as is. For secondary text use `text-fg-muted` rather than
picking a step.

### Simple mode

`data-simple` on `<html>` drops the transparency, the star canvas and the gradients. Two
knobs compensate, both set on `:root[data-simple]` in `semantic.module.css`:
`--color-fg-muted` steps to `fg-450` (`fg-500` in light mode), and
`--shadow-strength` drops to 0.7. Muted captions were measured at 3.4-4.1:1 on
the simple backdrop before that; they now land at 4.9-8.2:1. Keep the
combination — raising only one of the two reintroduces the washed-out look.

## Rules for new UI

- Reuse existing components and utilities before adding CSS.
- Animate show/hide with `starting:` and `transition-discrete` (see
  [Show/hide transitions](#showhide-transitions)); do not toggle `display`
  instantly when the change shifts layout.
- Do not invent a class that is absent from `styles/`.
- Keep layout responsive with flex, grid, container, and gap utilities.
- Keep focus states and accessible labels on interactive controls.
- Keep repeated framed content in `Card`; use unframed layout for page sections.
- Validate frontend changes with `corepack pnpm --filter scriptr-next check-types`
  and `corepack pnpm format` from the repository root. Formatting applies Biome fixes
  automatically; do not run lint as a separate validation step.
