**Scriptr Monorepo Workspaces**

* `hono/` — Hono API (`@scriptr/api`): Supabase, R2 file operations, route docs.
* `next/` — Next.js frontend (`scriptr-next`), Server Components, shared UI.
* `sanity/` — Sanity Studio (`scriptr-sanity`) and schema tooling.
* `optimizer/` — file optimizer (`@scriptr/optimizer`, sharp/Ghostscript), called by the API from `/file-ops/finalize`.
* `shared/` — types, config, strings and utils that all of the above import.

**Read First**

* `ARCHITECTURE.md` (how the system works) and `PROGRESS.md` (outstanding work only — never propose something already listed there as done, and don't re-add finished features to it). Plus the target workspace's README before working in it.
* `hono/src/routes/API_DOCUMENTATION.md` before touching a route: it records the real RLS/client model per table, which is not what the route file implies.
* Where docs and code disagree, trust the code and flag the drift rather than working around it.

**Global Rules**

* Strict TypeScript, no `any`. SOLID, composition over inheritance.
* DRY only at 2+ real usages — don't add abstractions speculatively.
* Types live in `shared/types/` (preferred), `next/types/`, or `hono/src/types/`. In-file types only if <3 fields and strictly local. **Anything a `hono/` route imports must live under `shared/`, never `next/types/`.**
* **User-facing strings** live in `shared/strings/<area>-strings.ts` or `UI_STRINGS` (`shared/config/strings.ts`), never inline in components. Copy that depends on a value is a function on the strings object. Reuse before adding.
* Academic entity types (faculty/study/subject/etc.) derive from the Sanity TypeGen query result via `WithResolvedSanityData<...>` (`shared/types/sanity-transform.types.ts`), not hand-written; hand-write only where no query-result type exists.
* **Never hand-edit generated files:** `shared/types/database.types.ts`, `shared/types/sanity.types.ts`, `sanity/schema.json`, `hono/src/types/supabase.ts`, `shared/config/api-routes.ts`.
  * Postgres schema change → `corepack pnpm gen:api-types`; Sanity schema change → `corepack pnpm sanity:typegen`.
  * `shared/config/api-routes.ts` is generated from the mounted Hono `app.routes` (`shared/config/api.ts` only supplies the `QUERY_CONFIG` query-param helpers), so register and mount the route, then run `corepack pnpm gen:api-endpoints` — it does not regenerate on `dev`.
  * A schema change isn't done until dead references are removed across `hono/`, `next/` and `sanity/` and a full `corepack pnpm check-types` passes.
* Secrets only in `.env` — never in docs, fixtures, or commits.
* From the root: `corepack pnpm dev:{hono|next|sanity|optimizer}` (bare `dev` runs all four), `check-types` (`--filter <package>` to scope), `test` (`tsx --test` on `node:test`, `*.test.ts` beside the code — API and optimizer), `format` (Biome; it is the linter, so don't run a separate one).
* Validate the smallest affected workspace and keep changes scoped — no unrelated refactors riding along. When a feature or route changes, update `PROGRESS.md` (remove what the change finishes, add what it leaves open) and, if the design changed, `ARCHITECTURE.md`. Doc filenames stay uppercase.

**Database & Supabase**

* RLS is the real authorization boundary, not the route handler — before writing or reviewing a query, check what RLS actually grants (`pg_policies`) rather than assuming from the table's category. Two tables that look alike (e.g. `professor_ratings` vs. `professors`) can have opposite access models.
* Client choice per query, not per file: `createSupabaseClient` when RLS alone grants the caller (own resource, or `is_admin()`-gated); `createInternalSupabaseClient` only where no RLS path exists for the caller at all (catalog tables, `download_events`, notification/achievement inserts, role changes). Backwards = a silent 403 or a bypassed check — see `API_DOCUMENTATION.md#client-access-patterns`.
* Check the live schema (policies, constraints, triggers) or `hono/supabase/migrations` before writing a route against a table you haven't verified this session; don't trust a doc or a memory of the schema.
* Never leak raw Postgres errors; map at the route: `23505` → `409`, `23503` (FK) → `409` naming the dependent, `42501` (RLS) → `403`, `P0001` → `400` with the message as-is.

**Backend (`hono/`)**

* Arrow functions, RESTful conventions, consistent status codes.
* **Typed responses:** the response type lives in `shared/types/` and is applied at the route (`c.json<LoginResponse>(...)`). New or changed routes add or update the shared type — never return a bare object.
* **Mount new route files:** a documented route file with no `.route()` call in `hono/src/index.ts` type-checks clean and 404s in production. Grep `index.ts` before calling the work done, then `corepack pnpm gen:api-endpoints`.
* Mirror an existing sibling with the same access shape (a new own-resource table copies `profile-subjects.ts`, not `flags.ts`) instead of inventing a pattern.
* Restriction checks (`profile_restrictions`/`is_restricted()`) block create/update only — never delete/remove. Confirm against `ARCHITECTURE.md §4` rather than inferring from a similar endpoint.
* Always update `API_DOCUMENTATION.md` and `API_TESTING_GUIDE.md` when a route changes.
* `hono/src/sanity-stub.d.ts` lets `hono/` import Sanity TypeGen types without `@sanity/client`; don't remove it or install the package to silence the error.
* Auth is the Supabase session cookie only — no Bearer-token path. `/auth/login`, `/auth/callback` and `/auth/session` return the app-shaped `SessionUser`.

**Frontend (`next/`) — Next.js 16, React 19**

* Server Components by default; add `'use client'` only for real interactivity/state/effects and `'use server'` only for real Server Actions. No speculative directives.
* React Compiler is on (`reactCompiler: true`) — don't hand-write `useMemo`/`useCallback`/`React.memo`; justify any exception in a comment.
* `params`/`searchParams` are `Promise`s in pages, layouts and `generateMetadata` — always `await`. This is a hard failure in 16, not a warning as in 15.
* Turbopack is the default bundler; no webpack-specific config without a documented reason.
* There is no middleware today. If request interception is needed, add `proxy.ts` (Node.js runtime) — never `middleware.ts`.
* `revalidateTag()` needs a `cacheLife` profile (a bare single-argument call behaves differently now); scripts revalidate by tag on mutation (`ARCHITECTURE.md §3`). `/api/revalidate` keeps `revalidateTag(tag, { expire: 0 })` so a mutation never serves stale data.
* `next/image`: assume 16-era defaults (async decoding, `fetchPriority: auto`, `qualities`/`minimumCacheTTL`/`imageSizes` in `next.config.ts`) — not the 15 behaviour.
* UI: follow `next/STYLING_GUIDE.md` exactly — reuse `Box`/`Card`/`Button`/`Badge`/`Divider` and the `ui-*`/`cp-*` classes; never invent a class absent from `styles/`. Theme through `next/providers/theme/`, never hardcoded colours. Add a utility only at 3+ repeats, and update the guide.
* **API calls:** only `apiFetch` (`next/lib/api/next-api.ts`) and the per-domain wrappers in `next/lib/api/*-api.ts`, with paths from `apiRoutes` (`shared/config/api-routes.ts`) — never a new `fetch` pattern or a hardcoded path string.
* Every screen needs loading, error and empty states, and semantic/ARIA-correct HTML.
* **Keep pages thin:** a new or refactored `page.tsx` awaits params, calls a loader in `next/lib/<feature>-page.ts` (fetching, cookies, 404s) and composes components that take a view model from `next/types/components/`. Components don't fetch; one responsibility each. See `ARCHITECTURE.md §8`.

**Sanity (`sanity/`)**

* Follow the existing entity pattern (mini-schemas, "Create in Database"/"Sync with Database"/checked-delete actions) — see `ARCHITECTURE.md §2`. A new academic entity extends `getDatabaseAcademicEndpoints` (`shared/utils/api.utils.ts`) and `parentFieldFor`/`parentColumnFor` (`sanity/actions/academicEntitySync.ts`) exhaustively (switch with no silent default) — no special cases.
* Publishing stays blocked until a document has a `dbId`, and deletion stays blocked on the internal API's dependency check (`409`). Don't bypass either.
* `SANITY_STUDIO_INTERNAL_SECRET` (Studio) and `INTERNAL_API_SECRET` (server) must match, and `SANITY_STUDIO_API_URL` must point at the real API outside local — check these before debugging Studio actions as a logic bug.