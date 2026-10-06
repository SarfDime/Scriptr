# Scriptr UI Styling Guide

This guide describes the styling primitives currently defined in `styles/`.
The CSS files are the source of truth; update this guide when a public utility
or component class changes.

## Files

- `styles/main.css`: Tailwind entry point and stylesheet imports.
- `styles/base/breakpoints.module.css`: viewport breakpoints (`--breakpoint-*`).
- `styles/base/colors.module.css`: theme and color tokens.
- `styles/base/utilities.module.css`: small global utilities and animations.
- `styles/components/components.module.css`: layout, card, prose, and palette utilities.
- `styles/components/button.module.css`: button base and variants.
- `styles/components/color-palettes.module.css`: badge color classes.

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
classes:

| Class         | Use                                 |
| ------------- | ----------------------------------- |
| `ui-display`  | Large page heading.                 |
| `ui-title`    | Section or card heading.            |
| `ui-subtitle` | Supporting copy.                    |
| `ui-body`     | Standard body copy.                 |
| `ui-label`    | Emphasized compact label.           |
| `ui-caption`  | Muted metadata or compact controls. |
| `ui-stat`     | Numeric activity/stat value.        |

Prefer parent `ui-stack` or `ui-cluster` gaps over `mt-*` and `mb-*` spacing
between sibling elements.

## Surfaces and content

The preferred component APIs are `Box`, `Card`, `Button`, `Badge`, and
`Divider`.

| Class            | Use                                                           |
| ---------------- | ------------------------------------------------------------- |
| `ui-card`        | Framed surface. Prefer the `Card` component.                  |
| `ui-card-header` | Card heading section.                                         |
| `ui-card-body`   | Main card content.                                            |
| `ui-card-footer` | Card footer with a top border.                                |
| `ui-button`      | Shared radius and sizing behavior for button-like components. |
| `ui-badge`       | Shared radius and sizing behavior for badges.                 |
| `ui-above`       | Semi transparent blurred background, blur and shadow. Sets no border width; add `border`. |
| `ui-above-light` | Lighter variant of `ui-above`.                                |
| `ui-above-dark`  | More opaque variant of `ui-above`.                            |

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

| Layer | Classes                                                       | Component       |
| ----- | ------------------------------------------------------------- | --------------- |
| Outer | `ui-above rounded-xl border p-3`                              | `ScriptSurface` |
| Inner | `rounded-lg border border-grey-200 bg-background-100/60 p-4`  | `ScriptPanel`   |

`ScriptPanel` renders an `aside` by default; pass `as='div'` for non-landmark
content such as file cards. Do not put `ui-card` and a `bg-*` utility on one
element to override its fill; use `ScriptPanel` or a plain `Box`.

## Responsive layout

- **Wrap by space, not by breakpoint.** Use `flex flex-wrap` with a `basis-*`
  and `grow` per item. Unequal grow values (e.g. `grow-[100]` next to `grow`)
  make the main item take the free space and be the one that wraps first. For
  card grids use `grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))]`.
- **Container queries** are built into Tailwind v4: mark the element
  `@container` and use `@md:` and friends on its descendants, so the layout
  follows the element's own width. Only viewport breakpoints are customized
  (`breakpoints.module.css`); container sizes are Tailwind's defaults (`@md` =
  28rem). An `@container` element cannot size itself to its content (it uses
  inline-size containment), so cap it with `max-w-*` instead of `w-fit`.

## Gotchas

- **Button font sizes differ.** `solid`, `subtle`, `golden`, `success` and
  `error` set `font-size: 1rem`; `outline`, `ghost` and `basic` do not. When
  buttons sit side by side, give them the same size classes and use the
  important modifier (`text-sm!`) so they match.
- **Sanity icons** get a global 1.5rem size (`[data-sanity-icon]:not(.overwrite)`).
  For a smaller icon use `className='overwrite size-5'`.
- **Palette borders.** `cp-*` classes without `-nb` include a 1px border. Under
  a parent with `overflow-hidden rounded-*` the border's corners are clipped;
  round the element itself.
- **`NextImage`** applies `className` to its skeleton wrapper, not the `<img>`.
  Use `objectFitProp='cover'` to crop (the default is contain) and pass `sizes`.
- **`Dialog`** has no `.dialog` CSS: its base styling is inline Tailwind merged
  with `cn`. Customize through `dialogProps.className`, `headerProps.className`
  and `titleProps.className`; later classes override the base ones (e.g.
  `md:w-fit`, `md:min-w-2xl`). The file preview and sign-in modals are styled
  this way.

## Buttons

The base utility is `button`. Available variants are:

- `button solid`: primary action.
- `button outline`: outlined brand action.
- `button transparent`: legacy outlined brand action.
- `button ghost`: transparent low-emphasis action with a hover surface.
- `button link`: text link action with no button padding.
- `button basic`: low-emphasis text action.
- `button inverted`: light surface with brand text.
- `button subtle`: muted filled action.
- `button golden`: highlighted attention action.
- `button success`: positive action.
- `button warning`: warning action.
- `button danger`: destructive action.
- `button error`: legacy destructive action.

```tsx
<Button className='button solid'>Save</Button>
<Button className='button subtle'>Cancel</Button>
<Button className='button error'>Delete</Button>
```

Use an icon and an accessible `aria-label` for icon-only controls. Use text
when the action is not obvious from a familiar icon.

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

## Rules for new UI

- Reuse existing components and utilities before adding CSS.
- Do not invent a class that is absent from `styles/`.
- Keep layout responsive with flex, grid, container, and gap utilities.
- Keep focus states and accessible labels on interactive controls.
- Keep repeated framed content in `Card`; use unframed layout for page sections.
- Validate frontend changes with `npm run check-types --workspace next` and
  `npm run format` from the repository root. Formatting applies Biome fixes
  automatically; do not run lint as a separate validation step.
