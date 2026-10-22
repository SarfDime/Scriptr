**Scriptr Monorepo Workspaces**

* `hono/`: Hono API, Supabase, R2 file operations, API docs.
* `next/`: Next.js frontend, shared UI components.
* `sanity/`: Sanity Studio, schema tooling.
* `shared/`: Shared types and config.

**Read First**

* `ARCHITECTURE.md` — how the system is designed to work (current state).
* `PROGRESS.md` — what's built vs. outstanding. Don't propose something already listed done, and check here before assuming a feature doesn't exist.
* Target workspace README before starting work in it.
* `hono/src/routes/API_DOCUMENTATION.md` before touching any route — it documents the actual RLS/client model per table, which is not always what you'd guess from the route file alone.

**Global Rules**

* Strict TypeScript, no `any`. SOLID, composition over inheritance.
* DRY only at 2+ real usages — don't add abstractions speculatively.
* Types live in `shared/types/` (preferred), `next/types/`, or `hono/src/types/`. In-file types only if <3 fields and strictly local. **Anything a `hono/` route imports must live under `shared/`, never `next/types/`.**
* **User-facing strings** live in `shared/strings/<area>-strings.ts` (`comments-strings.ts`, `scripts-strings.ts`) or `UI_STRINGS` (`shared/config/strings.ts`) — never inline in components. Copy that depends on a value is a small function in the strings object. Check both before adding a string and reuse rather than duplicate.
* Academic entity types (faculty/study/subject/etc.) are derived from the Sanity TypeGen query-result type via `WithResolvedSanityData<...>` (`shared/types/sanity-transform.types.ts`), e.g. `NonNullable<WithResolvedSanityData<StudyDetailQueryResult>>`, not hand-written. Hand-write a type only where no query-result type exists.
* NEVER hand-edit generated files: `shared/types/database.types.ts`, `shared/types/sanity.types.ts`, `sanity/schema.json`, `hono/src/types/supabase.ts`, `shared/config/api-routes.ts`.
  * Postgres schema change: `corepack pnpm gen:api-types`.
  * Sanity schema change: `corepack pnpm sanity:typegen`.
  * `shared/config/api-routes.ts`: run `corepack pnpm gen:api-endpoints` after adding, removing, or renaming a route (it does not regenerate on dev); edit its source, `shared/config/api.ts`, never the output.
  * After any schema change, grep/remove dead references across `hono/`, `next/`, and `sanity/`, then run a full `corepack pnpm check-types`. A schema change isn't done until types are regenerated and everything typechecks.
* Secrets only in `.env`, never in docs/fixtures/commits.
* Validate the smallest affected workspace first; implement and verify locally, don't stop at a plan. Keep changes scoped — no unrelated refactors riding along.
* Commands (from root): `corepack pnpm dev:{hono|next|sanity}`, `corepack pnpm check-types` (`--filter <package>` to scope), `corepack pnpm format` (Biome; this replaces manual lint, don't run a separate linter).
* Docs hygiene: when a feature or route changes, update `PROGRESS.md` (status), and `ARCHITECTURE.md` if the design changed. Doc filenames are uppercase (`ARCHITECTURE.md`, `PROGRESS.md`).

**Database & Supabase**

* RLS is the real authorization boundary, not the route handler — before writing or reviewing a query, check what RLS actually grants (`pg_policies`) rather than assuming from the table's category. Two tables that look alike (e.g. `professor_ratings` vs. `professors`) can have opposite access models.
* Client choice per query, not per file: session client (`createSupabaseClient`) when RLS alone grants the caller access (own resource, or `is_admin()`-gated); service-role client (`createInternalSupabaseClient`) only where no RLS path exists for the caller at all (catalog tables, `download_events`, notification/achievement inserts, role changes). Getting this backwards either silently 403s a legitimate caller or bypasses an intended check — see `API_DOCUMENTATION.md#client-access-patterns`.
* Supabase MCP access is available — use it to check live schema/RLS/constraints/triggers before writing a route against a table you haven't verified this session, rather than trusting a doc or a memory of the schema. Docs drift; the database doesn't.
* Map Postgres errors to clean HTTP codes at the route, don't let raw Postgres messages leak: `23505` → `409`, `23503` (FK) → `409` with a named-dependent message, `42501` (RLS violation) → `403`, a custom `RAISE EXCEPTION` (`P0001`) → `400` with the message as-is.

**Backend (`hono/`)**

* Arrow functions, RESTful conventions, consistent status codes.
* **Typed responses:** define each route's response type in `shared/types/` and apply it at the route (`c.json<LoginResponse>(...)`). New or changed routes must add/update the shared type rather than returning an untyped object.
* Always update `API_DOCUMENTATION.md` and `API_TESTING_GUIDE.md` when a route changes, and reflect the change in `PROGRESS.md`.
* **Mount new route files:** a built, documented route file with no `.route()` call in `hono/src/index.ts` type-checks clean and silently 404s in production. Grep `index.ts` for it before calling the work done, then run `corepack pnpm gen:api-endpoints` so `apiRoutes` picks it up.
* Restriction checks (`profile_restrictions`/`is_restricted()`) block create/update only, never delete/remove — confirm against `ARCHITECTURE.md §4` before adding or removing a check, don't infer it from a similar-looking endpoint.
* New route files should mirror an existing sibling with the same access shape (e.g. a new own-resource table → copy `profile-subjects.ts`'s shape, not `flags.ts`'s) rather than inventing a new pattern.
* **Type-only Sanity imports:** `hono/src/sanity-stub.d.ts` stubs `@sanity/client`'s module augmentation target so `hono/` can import Sanity TypeGen types without the package. Don't remove it, and don't install `@sanity/client` just to silence a missing-module error.
* Auth is the Supabase session cookie only (no Bearer path); `/auth/login`, `/auth/callback`, and `/auth/session` return the app-shaped `SessionUser`.

**Frontend (`next/`) — Next.js 16, React 19**

* React Compiler is stable and in use — do not hand-write `useMemo`/`useCallback`/`React.memo`. Only add manual memoization where you've confirmed the compiler can't help (rare; justify it in a comment if you do).
* Server Components by default. Add `'use client'` only where interactivity/state/effects actually require it; `'use server'` only for real Server Actions. Don't add a directive speculatively.
* `params`/`searchParams` are `Promise`s in pages, layouts, and `generateMetadata` — this is a hard failure in 16, not a warning like 15. Always `await` them.
* Middleware is `proxy.ts`, not `middleware.ts`, and Node.js runtime only — check which one exists before adding request-interception logic.
* Turbopack is the default bundler; don't add webpack-specific config unless there's a documented reason to opt out.
* `revalidateTag()` needs a `cacheLife` profile now — a bare single-argument call no longer behaves like before. Check the profile is actually attached when touching cache invalidation (scripts already use tag revalidation on mutation — see `ARCHITECTURE.md §3`). The `/api/revalidate` webhook deliberately uses `revalidateTag(tag, { expire: 0 })` so a mutation never serves stale data; keep that unless there is a documented reason to change it.
* `next/image` defaults changed (async decoding, `fetchPriority: auto`, new `qualities`/`minimumCacheTTL`/`imageSizes`) — don't assume 15-era defaults when reasoning about image behavior.
* UI/styling: follow `next/STYLING_GUIDE.md` exactly — reuse `Box`/`Card`/`Button`/`Badge`/`Divider` and the `ui-*`/`cp-*` classes documented there; never invent a class absent from `styles/`. Theme via `next/providers/theme/`, never hardcoded colors. Add a new utility only if repeated 3+ times (and update the guide).
* **API calls:** all backend calls go through `apiFetch` (`next/lib/api/next-api.ts`; per-domain wrappers live in `next/lib/api/*-api.ts`) with paths from `shared/config/api-routes.ts`'s `apiRoutes` — never a new `fetch` pattern, never a hardcoded path string. (A Hono RPC `hc<AppType>` client was tried and abandoned: at ~140+ endpoints it hung the editor's type checking. `apiRoutes` is plain generated path strings with no dependency on Hono's types.)
* Every screen needs loading, error, and empty states, and semantic/ARIA-correct HTML.
* **Keep pages thin:** `page.tsx` awaits params, calls a loader in `next/lib/<feature>-page.ts` (fetching, cookies, 404s), and composes small components that take a view model (types in `next/types/components/`). Components don't fetch; one component, one responsibility. See `ARCHITECTURE.md §8`.

**Sanity (`sanity/`)**

* Follow the existing entity pattern (mini-schemas, "Create in Database"/"Sync with Database"/checked-delete actions) — see `ARCHITECTURE.md §2`. A new academic entity type should extend the academic endpoint map (`getDatabaseAcademicEndpoints`) and `parentFieldFor`/`parentColumnFor` exhaustively (switch with no silent default), not add a special case.
* Publishing must stay blocked until a document has a `dbId`; deletion must stay blocked on the internal API's dependency check (`409`) — don't bypass either for convenience.
* `SANITY_STUDIO_INTERNAL_SECRET` (Studio) and `INTERNAL_API_SECRET` (server) must match; `SANITY_STUDIO_API_URL` must point at the real API in any non-local environment — check these before debugging Studio action failures as a logic bug.

**When Unsure**

* Prefer checking the live database (Supabase MCP) or the actual route/component file over trusting this document, `ARCHITECTURE.md`, or any comment — all can drift from the code. Flag drift you find rather than silently working around it.