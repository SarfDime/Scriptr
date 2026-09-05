# Scriptr Agent Guide

Scriptr is an npm workspace monorepo with three packages:

- `hono/`: Hono API, Supabase access, R2 file operations, and API docs.
- `next/`: Next.js frontend and shared UI components.
- `sanity/`: Sanity Studio and schema tooling.
- `shared/`: types and configuration shared by workspaces.

## Before editing

1. Read the README for the workspace you will change.
2. Check the nearest implementation and its callers before introducing a new pattern.
3. Treat generated files as generated: do not hand-edit `shared/types/database.types.ts`, `next/sanity.types.ts`, or `sanity/schema.json`. `hono/src/types/supabase.ts` is only a compatibility re-export.
4. Keep secrets in `.env` files. Never add credentials, cookies, tokens, or production data to docs or fixtures.
5. Start from the smallest concrete anchor: the owning file, symbol, failing check, or nearby test.
6. Before editing, identify one local hypothesis and one cheap check that could disprove it.

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

- Use `npm run format` after edits. It applies Biome fixes automatically; do not run `npm run lint` as a separate step.
- Keep API behavior documented in `hono/src/routes/API_DOCUMENTATION.md` and request examples in `hono/src/routes/API_TESTING_GUIDE.md`.
- For frontend styling, use the primitives and tokens documented in `next/STYLING_GUIDE.md`; CSS files are the source of truth.
- Prefer existing components, helpers, route patterns, and workspace scripts over new abstractions.
- Validate the smallest affected workspace first, then run the broader check when shared code or configuration changes.
- Run the narrowest typecheck that covers the change before the full `npm run check-types`.
- Keep generated output, unrelated refactors, and dependency changes out of focused fixes.
- Do not add a new helper or abstraction until an existing one has been ruled out.
- Do not stop at a plan when the requested change can be implemented and checked locally.