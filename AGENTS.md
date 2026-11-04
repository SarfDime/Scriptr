# Scriptr Agent Guide

How to work in this monorepo: the shared rules live here, and each workspace has
its own guide in `docs/`. Start with [Read First](#read-first), then open the
[App Guide](#app-guides) for the workspace you are about to touch.

## Workspaces

* `hono/` — Hono API (`@scriptr/api`): Supabase, R2 file operations, route docs.
* `next/` — Next.js frontend (`scriptr-next`), Server Components, shared UI.
* `sanity/` — Sanity Studio (`scriptr-sanity`) and schema tooling.
* `optimizer/` — file optimizer (`@scriptr/optimizer`, sharp/Ghostscript), called by the API from `/file-ops/finalize`.
* `shared/` — types, config, strings and utils that all of the above import.

## Read First

* `docs/ARCHITECTURE.md` (how the system works) and `docs/PROGRESS.md` (outstanding work only — never propose something already listed there as done, and don't re-add finished features to it). Plus the target workspace's README before working in it.
* `hono/src/routes/API_DOCUMENTATION.md` before touching a route: it records the real RLS/client model per table, which is not what the route file implies.
* Where docs and code disagree, trust the code and flag the drift rather than working around it.

## Global Rules

* Strict TypeScript, no `any`. SOLID, composition over inheritance.
* DRY only at 2+ real usages — don't add abstractions speculatively.
* Types live in `shared/types/` (preferred), `next/types/`, or `hono/src/types/`. In-file types only if <3 fields and strictly local. **Anything a `hono/` route imports must live under `shared/`, never `next/types/`.**
* **User-facing strings** live in `shared/strings/<area>-strings.ts` or `UI_STRINGS` (`shared/config/strings.ts`), never inline in components. Copy that depends on a value is a function on the strings object. Reuse before adding.
* Academic entity types (faculty/study/subject/etc.) derive from the Sanity TypeGen query result via `WithResolvedSanityData<...>` (`shared/types/sanity-transform.types.ts`), not hand-written; hand-write only where no query-result type exists.
* **Never hand-edit generated files:** `shared/types/database.types.ts`, `shared/types/sanity.types.ts`, `sanity/schema.json`, `hono/src/types/supabase.ts`, `shared/config/api-routes.ts`.
  * Postgres schema change → `corepack pnpm gen:api-types`; Sanity schema change → `corepack pnpm sanity:typegen`.
  * `shared/config/api-routes.ts` is generated from the mounted Hono `app.routes` (`shared/config/api.ts` only supplies the `QUERY_CONFIG` query-param helpers), so register and mount the route, then run `corepack pnpm gen:api-endpoints` — it does not regenerate on `dev`.
  * A schema change isn't done until dead references are removed across `hono/`, `next/` and `sanity/` and a full `corepack pnpm check-types` passes.
* **Every workspace logs an environment checklist on start** (`ENV_REQUIREMENTS` in `hono/src/server.ts`, `next/lib/startup-report.ts`, `sanity/lib/startup-report.ts`, `optimizer/src/server.ts`, built by `shared/utils/env-report.ts`). A new env var gets an entry there in the same change; it lists names and consequences only, never values.
* Secrets only in `.env` — never in docs, fixtures, or commits. Service-to-service secrets (`SITEMAP_SECRET` and the like) never get a `NEXT_PUBLIC_` prefix and never reach browser code or user-triggered client calls; see `docs/AGENTS-FRONTEND.md`. **Never put a secret in a `SANITY_STUDIO_*` variable** — Vite inlines them into the public Studio bundle; the Studio authenticates with a TOTP code instead (see `docs/AGENTS-SANITY.md`).
* From the root: `corepack pnpm dev:{hono|next|sanity|optimizer}` (bare `dev` runs all four), `check-types` (`--filter <package>` to scope), `test` (`tsx --test` on `node:test`, `*.test.ts` beside the code — API and optimizer), `format` (Biome; it is the linter, so don't run a separate one).
* Validate the smallest affected workspace and keep changes scoped — no unrelated refactors riding along. When a feature or route changes, update `docs/PROGRESS.md` (remove what the change finishes, add what it leaves open) and, if the design changed, `docs/ARCHITECTURE.md`. Doc filenames stay uppercase.

## App Guides

The Global Rules above apply everywhere; the per-app guides add rules for one workspace. Open the one you are about to work in.

| Doc | Workspace | Read before touching |
| --- | --- | --- |
| [`docs/AGENTS-DATABASE.md`](docs/AGENTS-DATABASE.md) | Supabase (used by `hono/`) | any query, RLS policy, migration or Supabase client choice |
| [`docs/AGENTS-BACKEND.md`](docs/AGENTS-BACKEND.md) | `hono/` | any route, response type, route mount or restriction check |
| [`docs/AGENTS-FRONTEND.md`](docs/AGENTS-FRONTEND.md) | `next/` | any page, component, API call, cache tag or styling |
| [`docs/AGENTS-SANITY.md`](docs/AGENTS-SANITY.md) | `sanity/` | any Studio schema, database sync, or publish/delete behaviour |
| [`optimizer/README.md`](optimizer/README.md) | `optimizer/` | the file optimizer (no separate rules file; the README is the guide) |
