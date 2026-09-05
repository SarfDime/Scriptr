# Scriptr UI Styling Guide

This guide describes the styling primitives currently defined in `styles/`.
The CSS files are the source of truth; update this guide when a public utility
or component class changes.

## Files

- `styles/main.css`: Tailwind entry point and stylesheet imports.
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

```tsx
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Metadata</Card.Footer>
</Card>
```

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

## Rules for new UI

- Reuse existing components and utilities before adding CSS.
- Do not invent a class that is absent from `styles/`.
- Keep layout responsive with flex, grid, container, and gap utilities.
- Keep focus states and accessible labels on interactive controls.
- Keep repeated framed content in `Card`; use unframed layout for page sections.
- Validate frontend changes with `npm run check-types --workspace next` and
  `npm run format` from the repository root. Formatting applies Biome fixes
  automatically; do not run lint as a separate validation step.
