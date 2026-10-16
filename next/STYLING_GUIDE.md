# Scriptr UI Styling Guide

This guide describes the styling primitives currently defined in `next/styles/`
(paths below are relative to `next/`). The CSS files are the source of truth; update this guide when a public utility
or component class changes.

## Files

- `styles/main.css`: Tailwind entry point and stylesheet imports.
- `styles/base/breakpoints.module.css`: viewport breakpoints (`--breakpoint-*`).
- `styles/base/colors.module.css`: theme and color tokens.
- `styles/base/semantic.module.css`: role-based tokens that resolve per theme (`text-fg-muted`).
- `styles/base/shadows.module.css`: elevation tokens (`shadow-sm` to `shadow-xl`, button shadows).
- `styles/base/utilities.module.css`: small global utilities and animations.
- `styles/components/components.module.css`: layout, card, prose, and palette utilities.
- `styles/components/button.module.css`: button base and variants.
- `styles/components/color-palettes.module.css`: badge color classes.
- `styles/components/portable-text.module.css`: authored rich-text styles, including the responsive `font-size-*` classes.
- `styles/components/skeleton.module.css`: skeleton loading wash.
- `styles/components/toast.module.css`: toast styles.

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

| Class            | Use                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `ui-card`        | Framed surface. Prefer the `Card` component.                                              |
| `ui-card-header` | Card heading section.                                                                     |
| `ui-card-body`   | Main card content.                                                                        |
| `ui-card-footer` | Card footer with a top border.                                                            |
| `ui-badge`       | Shared radius and sizing behavior for badges.                                             |
| `ui-above`       | Semi transparent blurred background, blur and shadow. Sets no border width; add `border`. |
| `ui-above-light` | Lighter variant of `ui-above`.                                                            |

```tsx
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Metadata</Card.Footer>
</Card>
```

## Layered surfaces

Content on the script pages and in dialogs sits on two layers: an outer frosted
surface and, inside it, a lighter fill where the text is shown.

| Layer | Classes                                                 | Component       |
| ----- | ------------------------------------------------------- | --------------- |
| Outer | `ui-above rounded-xl border p-3`                        | `ScriptSurface` |
| Inner | `rounded-lg border border-grey-200 ui-above-inside p-4` | `ScriptPanel`   |

`ScriptPanel` renders an `aside` by default; pass `as='div'` for non-landmark
content such as file cards. Do not put `ui-card` and a `bg-*` utility on one
element to override its fill; use `ScriptPanel` or a plain `Box`.

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
- **`NextImage`** applies `className` to its skeleton wrapper, not the `<img>`.
  Use `objectFitProp='cover'` to crop (the default is contain) and pass `sizes`.
  Always select `sizes` from the shared `IMAGE_SIZES` registry.
- **`Dialog`** styles itself with inline Tailwind merged with `cn` (there is no
  `.dialog` CSS). A centered dialog (the default) fills the screen below `md`:
  square, borderless, scrolling inside. From `md` up it is a framed
  `ui-above-light` card with `md:min-w-2xl`. The padding is on the header (a
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

## Shadows

Shadows are crisp and directional: a 1px contact line plus a short, tight drop
(blur 10px or less; the larger steps use negative spread so no halo spreads
past the edge). Do not add zero-offset glows or blur above about 12px.

| Token / class              | Use                                             |
| -------------------------- | ----------------------------------------------- |
| `shadow-sm`                | Cards, avatars, resting quiet buttons.          |
| `shadow-md` (`shadow-mdx`) | Frosted `ui-above` surfaces, toasts, dropdowns. |
| `shadow-lg`                | Dialogs and modals.                             |
| `shadow-xl`                | Select lists and popovers.                      |
| `--shadow-button`          | Filled buttons at rest (highlight + hard edge). |
| `--shadow-button-hover`    | Filled buttons on hover (1px lift).             |

Tailwind's defaults for `shadow-sm/md/lg/xl` are overridden, so the built-in
class names follow this scale. `--shadow-strength` (`semantic.module.css`) is
1 in light mode and 1.8 in dark mode and scales every alpha, so the same
tokens stay visible on dark surfaces. Change the look of the whole site by
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

### Known color-scale quirks

The `fg-*` and `grey-*` scales are not monotonic (for example `fg-400` is
lighter than `fg-350`, and `grey-200` is lighter than `grey-150`) and they flip
direction in dark mode. Reordering them would shift colors across the app, so
they are left as is. For secondary text use `text-fg-muted` rather than
picking a step.

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
