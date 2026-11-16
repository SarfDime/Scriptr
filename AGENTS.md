# Scriptr

Monorepo: `hono/` Hono API (`@scriptr/api`), `next/` Next.js app (`scriptr-next`),
`sanity/` Studio (`scriptr-sanity`), `optimizer/` file optimizer
(`@scriptr/optimizer`), `shared/` types, config, strings and utils the others import.

Workspace rules live with the workspace — read that guide before working there:

| Workspace | Guide |
| --- | --- |
| `hono/` and Supabase | [`hono/AGENTS.md`](hono/AGENTS.md) |
| `next/` | [`next/AGENTS.md`](next/AGENTS.md) |
| `sanity/` | [`sanity/AGENTS.md`](sanity/AGENTS.md) |
| `optimizer/` | [`optimizer/AGENTS.md`](optimizer/AGENTS.md) |

## Read first

* `docs/ARCHITECTURE.md` — index; open only the section for the area you touch.
* `docs/PROGRESS.md` — outstanding work. Never re-propose something listed as done.
* `hono/src/routes/API_DOCUMENTATION.md` — before touching a route; it records the
  real RLS/client model per table, which the route file does not show.
* `docs/ARCHITECTURE-STUDY-DOMAINS.md` — before minting a study URL, hostname,
  canonical or sitemap entry.
* `docs/CANVAS.md` — before touching a background canvas in `next/`.

Where a doc and the code disagree, trust the code and fix the doc.

## Rules

* Strict TypeScript, no `any`. SOLID and composition; KISS; DRY only at 2+ real usages.
* Types in `shared/types/` (preferred), `next/types/` or `hono/src/types/`; in-file
  only for fewer than three strictly local fields. A `hono/` route imports its types
  from `shared/`, never from `next/types/`.
* User-facing copy lives in `shared/strings/*` or `UI_STRINGS` — never inline in a
  component. Mechanics and traps: [`next/AGENTS.md`](next/AGENTS.md#localization).
* **Never hand-edit generated files**: `shared/types/database.types.ts`,
  `shared/types/sanity.types.ts`, `sanity/schema.json`, `hono/src/types/supabase.ts`,
  `shared/config/api-routes.ts`. Postgres change → `corepack pnpm gen:api-types`;
  Sanity change → `corepack pnpm sanity:typegen`; route change →
  `corepack pnpm gen:api-endpoints`. A schema change is done only once dead
  references are gone and a full `corepack pnpm check-types` passes.
* Secrets only in `.env` — never in docs, fixtures or commits. Every workspace logs
  its env checklist on start (`ENV_REQUIREMENTS`); a new variable gets an entry in the
  same change, naming the consequence, never the value.
* Commands, from the root: `corepack pnpm dev:{hono|next|sanity|optimizer}`,
  `check-types` (`--filter <package>`), `test` (`tsx --test`, `node:test`,
  `*.test.ts` beside the code), `format` (Biome — it is also the linter).
* Validate the smallest affected workspace and keep the change scoped; no unrelated
  refactors riding along.
* A finished feature updates `docs/PROGRESS.md` (remove what is done, add what is
  left); a design change also updates the matching `docs/ARCHITECTURE*.md`. Doc
  filenames stay uppercase.

## Writing

Docs, comments, commit messages and PR bodies follow one rule: write the least a
reader needs.

* One line over a paragraph; a table or list over prose. Delete any sentence that does
  not change a decision.
* State what is true of the code now. No history of the change, no narration of a bug
  that is fixed, no restating a signature or a type name.
* A comment earns its place only by explaining why, or a constraint the code cannot
  show (RLS/grant model, cache tags and what invalidates them, a security decision).
  Conventions belong in the workspace guide, not repeated in code.
* Before adding to a doc, cut something from it.
