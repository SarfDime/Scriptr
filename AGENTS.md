# Scriptr Agent Guide

Scriptr is an npm workspace monorepo with three packages:

- `hono/`: Hono API, Supabase access, R2 file operations, and API docs.
- `next/`: Next.js frontend and shared UI components.
- `sanity/`: Sanity Studio and schema tooling.
- `shared/`: types and configuration shared by workspaces.

## Roadmap and Progress Tracking

The project is organized around a phased roadmap defined in [roadmap.md](roadmap.md).

## Before editing

1. Read the README for the workspace you will change.
2. Check the current phase in [roadmap.md](roadmap.md) section 10 to understand focus areas.
3. Check the nearest implementation and its callers before introducing a new pattern.
4. Treat generated files as generated: do not hand-edit `shared/types/database.types.ts`, `next/sanity.types.ts`, or `sanity/schema.json`. `hono/src/types/supabase.ts` is only a compatibility re-export. After any schema change (for example, the removal of `scripts.faculty_id`), regenerate `shared/types/database.types.ts` with `npm run gen:api-types` before touching code that references the old column, then grep the `hono/` and `next/` workspaces for `faculty_id` usages on `scripts` to remove dead references.
5. Keep secrets in `.env` files. Never add credentials, cookies, tokens, or production data to docs or fixtures.
6. Start from the smallest concrete anchor: the owning file, symbol, failing check, or nearby test.
7. Before editing, identify one local hypothesis and one cheap check that could disprove it.

## Local commands

Run from the repository root:

```bash
npm install
npm run dev:hono
npm run dev:next
npm run dev:sanity
npm run check-types
npm run format
```

Use workspace checks when narrowing validation:

```bash
npm run check-types --workspace hono
npm run check-types --workspace next
npm run check-types --workspace sanity
```

## Conventions

### Code Quality and Design Principles

- **Follow SOLID principles**: Keep components single-responsibility, open to extension but closed for modification, use dependency injection when appropriate, and maintain loose coupling between modules.
- **DRY (Don't Repeat Yourself)**: If code or logic appears in multiple places, extract it into a reusable component or helper. New components should only be created when a pattern repeats in 2+ locations.
- **Prefer composition over inheritance**: Build features by composing existing components and hooks rather than extending base classes.
- **Type safety first**: Leverage TypeScript to catch errors at build time. Avoid `any` types; use proper generics and discriminated unions.

### Component and UI Development

- **Use existing components before creating new ones**: Always check `next/components/` for existing Button, Input, Select, Card, Modal, etc. before building new UI elements.
- **Leverage design system primitives**: Use reusable elements from the design system (e.g., `Box` instead of `div`, `Text` instead of `span`) to maintain consistency and reduce CSS overhead.
- **Reference**: See [next/STYLING_GUIDE.md](next/STYLING_GUIDE.md) for all available primitives and tokens.
- **Create new components only for repetition**: Extract a new component only if the same UI pattern appears in 2+ files or will clearly be reused.
- **Component naming**: Use clear, descriptive names (e.g., `ProfessorCard`, `ScriptUploadModal`, `FacultySelector`) that indicate purpose and usage.
- **Props and API design**: Keep component APIs minimal and intentional. Use TypeScript interfaces to document expected props and their purposes.

### Styling Conventions

- **Keep styles simple**: Avoid over-engineering CSS. Use the predefined tokens and classes from `next/STYLING_GUIDE.md`.
- **No style bloat**: Do not add CSS for edge cases or one-off designs. Reuse existing classes and token values.
- **Utility-first approach**: Use existing utility classes for spacing, colors, typography, and layout (e.g., `flex`, `gap-4`, `text-lg`). Create new utilities **only if the same style pattern repeats in 3+ places**. When adding new utilities, update `next/STYLING_GUIDE.md` to document them.
- **Minimal custom CSS**: Custom CSS is acceptable for component-specific styling, but prefer utilities first. Inline styles are a last resort.
- **Responsive design**: Use CSS media queries and the predefined breakpoint helpers documented in `next/STYLING_GUIDE.md`.
- **Dark mode and theming**: Leverage the theme provider in `next/providers/theme/` rather than hardcoding colors.

### Frontend-Specific Rules

- **Hooks over class components**: Always use functional components with React hooks (useState, useEffect, useContext, custom hooks).
- **Arrow functions**: Use arrow functions (`const handleClick = () => {}`) instead of function declarations (`function handleClick() {}`).
- **Custom hooks for logic**: Extract component logic into custom hooks in `next/hooks/` for reusability (e.g., `useToast`, `useDeviceType`, `useBodyScroll`).
- **API client usage**: Use the centralized API client from `next/lib/api.ts` for all backend calls. Never create new API fetching patterns.
- **State management**: Keep state as local as possible. Use context (theme, toaster) only for truly global concerns. Avoid prop drilling by using composition.
- **Error and loading states**: Always include loading, error, and empty states for async operations (see existing patterns in `next/components/`).
- **Accessibility**: Use semantic HTML elements, proper ARIA attributes, and keyboard navigation where applicable.

### Types and Interfaces

- **Centralize types**: Define reusable types in `next/types/`, `hono/src/types/`, or `shared/types/` depending on scope.
- **No in-file types**: Avoid defining types directly in component files unless the type is very small (1-3 fields) and **only used in that single file**.
- **Shared types first**: Always check `shared/types/` for existing type definitions before creating new ones.
- **Type naming**: Use clear, descriptive names (e.g., `ProfessorProfile`, `ScriptMetadata`, `DownloadEvent`) that indicate the entity being typed.
- **Export and reuse**: Export types from their definition file and import in components/routes that need them.

### Backend and API Development

- **Arrow functions**: Use arrow functions (`const handler = () => {}`) instead of function declarations (`function handler() {}`).
- **API documentation**: Keep `hono/src/routes/API_DOCUMENTATION.md` and `hono/src/routes/API_TESTING_GUIDE.md` up to date with request examples.
- **Endpoint design**: Follow RESTful conventions. Use GET for retrieval, POST for creation, PATCH for updates, DELETE for removal.
- **Error handling**: Consistent error responses with meaningful messages and appropriate HTTP status codes.
- **Type exports**: Reuse types from `shared/types/` and generated Supabase types in `hono/src/types/supabase.ts`.

### General Development Workflow

- Use `npm run format` after edits. It applies Biome fixes automatically; do not run `npm run lint` as a separate step.
- Prefer existing helpers, route patterns, and workspace scripts over new abstractions.
- Validate the smallest affected workspace first, then run broader checks when shared code changes.
- Run the narrowest typecheck that covers the change before the full `npm run check-types`.
- Keep generated output, unrelated refactors, and dependency changes out of focused fixes.
- Do not add a new helper or abstraction until an existing one has been ruled out.
- Do not stop at a plan when the requested change can be implemented and checked locally.

## Current Phase

See [roadmap.md section 10](roadmap.md#10-progress) for current implementation priorities and phase status.