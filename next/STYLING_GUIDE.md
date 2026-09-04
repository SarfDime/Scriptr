# Scriptr UI Styling Guide

This guide documents the shared `ui-*` classes defined in `styles/components/components.module.css` and `styles/base/utilities.module.css`.

## IntelliSense

The workspace is configured to use the official Tailwind CSS IntelliSense extension. It scans `styles/main.css`, including the custom `ui-*` classes imported from the component stylesheets.

When typing a class in a supported `className` attribute, such as `ui-c`, IntelliSense should suggest classes including `ui-cluster` and `ui-container`. Hovering a recognized class shows the generated CSS declarations when the extension can resolve the class.

The extension does not provide a supported workspace setting for custom prose descriptions inside completion suggestions. For the intent and recommended usage of each class, use this guide. The CSS declarations themselves remain the source of truth.

## Layout Primitives

### `ui-container`

Centers content and limits its width to `80rem` with responsive horizontal padding.

Use it inside navigation bars, headers, footers, and page sections.

```tsx
<div className='ui-container'>
  Content
</div>
```

### `ui-section`

Adds responsive vertical padding using `clamp()`.

Use it for full-width page sections, headers, and footers.

```tsx
<section className='ui-section'>
  <div className='ui-container'>Content</div>
</section>
```

### `ui-stack`

Creates a vertical flex layout with a configurable gap. The default gap is `1.5rem`.

Use it for forms, page content, panels, card content, and footer columns.

```tsx
<div className='ui-stack gap-3'>
  <h1>Title</h1>
  <p>Description</p>
</div>
```

### `ui-cluster`

Creates a horizontal, wrapping flex layout with centered items and a configurable gap. The default gap is `1rem`.

Use it for navigation links, header actions, button groups, tags, and footer links.

```tsx
<div className='ui-cluster'>
  <a href='/subjects'>Subjects</a>
  <a href='/scripts'>Scripts</a>
</div>
```

### Navigation link classes

| Class            | Purpose                                                          |
| ---------------- | ---------------------------------------------------------------- |
| `ui-link`        | Compact navigation link with a subtle bottom-border hover state. |
| `ui-link-active` | Marks the active navigation link with the brand color.           |

### `ui-box`

Provides `min-width: 0` for generic wrappers. It is automatically applied by the `Box` component.

### `ui-divider`

Applies the shared divider border color. It is automatically applied by the `Divider` component.

## Navigation

There is no dedicated `ui` or `ui-item` class. Use semantic HTML with the layout primitives:

```tsx
<nav>
  <div className='ui-container ui-cluster justify-between'>
    <a href='/'>Scriptr</a>

    <div className='ui-cluster'>
      <a className='ui-link' href='/subjects'>Subjects</a>
      <a className='ui-link' href='/scripts'>Scripts</a>
      <a className='ui-link' href='/professors'>Professors</a>
    </div>
  </div>
</nav>
```

Recommended composition:

- `nav` provides meaning and accessibility.
## Headers

```tsx
<header className='ui-section'>
  <div className='ui-container ui-stack gap-3'>
    <h1>Page title</h1>
    <p>Supporting text</p>
  </div>
</header>
```

Use `ui-section` for vertical spacing, `ui-container` for width, and `ui-stack` for title/subtitle content.

## Footers

There is no dedicated `ui-footer` class. Use semantic HTML with the shared layout classes:

```tsx
<footer className='border-t border-fg/20'>
  <div className='ui-container ui-section'>
    <div className='ui-cluster justify-between'>
      <p>Scriptr</p>

      <nav className='ui-cluster'>
        <a href='/about'>About</a>
        <a href='/contact'>Contact</a>
      </nav>
    </div>
  </div>
</footer>
```

Use `ui-stack` instead of `ui-cluster` when footer content should be vertical.

## Cards

### `ui-card`

Creates a framed surface with:

- Background and text color variables
The preferred API is the `Card` component:

```tsx
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Footer content</Card.Footer>
</Card>
```

### Card sections

| Class            | Purpose                                     |
| ---------------- | ------------------------------------------- |
| `ui-card-header` | Card heading area with bottom border.       |
| `ui-card-body`   | Main flexible content area.                 |
| `ui-card-footer` | Footer area with top border and muted text. |

## Buttons and Controls

The button styles are defined in `styles/components/button.module.css`.

| Class                | Purpose                                            |
| -------------------- | -------------------------------------------------- |
| `button solid`       | Primary action.                                    |
| `button transparent` | Transparent or outlined action.                    |
| `button subtle`      | Low-emphasis action.                               |
| `button golden`      | Golden highlight or attention action.              |
| `button success`     | Success action.                                    |
| `button error`       | Destructive or error action.                       |
| `ui-button`          | Shared radius behavior for button-like components. |

```tsx
<button className='button solid'>Save</button>
<button className='button subtle'>Cancel</button>
<button className='button error'>Delete</button>
```

Buttons automatically receive centered flex alignment, padding, transitions, and the shared UI radius.

## Theme Controls

| Class                    | Purpose                   |
| ------------------------ | ------------------------- |
| `ui-theme-toggle`        | Theme switcher container. |
| `ui-theme-option`        | Individual theme option.  |
| `ui-theme-option-active` | Selected theme option.    |

## Badges and Color Palettes

### Badge classes

| Class                                             | Purpose                                         |
| ------------------------------------------------- | ----------------------------------------------- |
| `ui-badge`                                        | Shared badge radius behavior.                   |
| `brand`, `green`, `yellow`, `red`, `blue`, `gray` | Base color palettes.                            |
| `light`                                           | Lighter palette variant, such as `brand light`. |
| `unstyled`                                        | Removes palette styling.                        |

### Surface palette classes

| Class                | Purpose                                                          |
| -------------------- | ---------------------------------------------------------------- |
| `ui-palette-brand`   | Brand-colored surface, border, text, and muted text variables.   |
| `ui-palette-success` | Success-colored surface, border, text, and muted text variables. |
| `ui-palette-warning` | Warning-colored surface, border, text, and muted text variables. |
| `ui-palette-danger`  | Danger-colored surface, border, text, and muted text variables.  |

Palette classes are especially useful on cards:

```tsx
<Card className='ui-palette-success'>
  Successful result
</Card>
```

## Rich Text

### `ui-prose`

Styles long-form content, including:

- Headings
Use it around Portable Text or other editorial content:

```tsx
<div className='ui-prose'>
  <PortableTextContent value={content} />
</div>
```

## Utility Classes

| Class              | Purpose                                              |

- Navigation bar: semantic `nav` + `ui-container` + `ui-cluster`
- Navigation items: `ui-link` inside `ui-cluster`
- Header: `ui-section` + `ui-container` + `ui-stack`
- Footer: semantic `footer` + `ui-container` + `ui-section`
- Vertical content: `ui-stack`
- Horizontal content: `ui-cluster`
- Page width: `ui-container`
- Full-width section spacing: `ui-section`
- Repeated framed content: `ui-card` or the `Card` component
- Long-form content: `ui-prose`
