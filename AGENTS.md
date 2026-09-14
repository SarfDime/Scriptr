**Scriptr Monorepo Workspaces**

* `hono/`: Hono API, Supabase, R2 file operations, API docs.
* `next/`: Next.js frontend, shared UI components.
* `sanity/`: Sanity Studio, schema tooling.
* `shared/`: Shared types and config.

**Workflow & Editing Rules**

* **Check Priorities:** Always review `ARCHITECTURE.md` (system design) and `PROGRESS.md` (what's done vs. outstanding) and target workspace READMEs before starting.
* **Generated Files:** NEVER hand-edit `shared/types/database.types.ts`, `next/sanity.types.ts`, `sanity/schema.json`, `hono/src/types/supabase.ts`, or `shared/config/api-routes.ts`.
* **Schema Changes:** Run `npm run gen:api-types`, then grep/remove dead references across `hono/` and `next/`.
* **Secrets:** Store exclusively in `.env`. No credentials or production data in docs/fixtures.
* **Local Checks:** Validate the smallest affected workspace first. Do not stop at a plan—implement and verify locally. Keep PRs focused; no unrelated refactors.

**Commands (Run from root)**

* **Dev:** `npm install`, `npm run dev:{hono|next|sanity}`
* **Validation:** `npm run check-types` (use `--workspace {name}` for scoped checks)
* **Formatting:** `npm run format` (Applies Biome fixes; replaces manual linting)

**Architecture & Code Quality**

* **Core Principles:** Use SOLID principles, composition over inheritance, and strict TypeScript (no `any`).
* **DRY:** Extract logic or UI components only if used in 2+ places. Do not add new abstractions if existing helpers work.
* **Prefer composition over inheritance**: Build features by composing existing components and hooks rather than extending base classes.
* **Types:** Centralize types in `shared/types/` (preferred), `next/types/`, or `hono/src/types/`. In-file types are only allowed if they are <3 fields and strictly local.

**Frontend (`next/`)**

* **UI/Styling:** Check `next/components/` and `next/STYLING_GUIDE.md` first. Use existing primitives (`Box`, `Text`), utility classes, and breakpoints. Avoid custom CSS. Add new utilities only if repeated 3+ times (and update the guide).
* **Theming:** Use `next/providers/theme/`. Do not hardcode colors.
* **React:** Use functional components, arrow functions, and custom hooks (`next/hooks/`). Keep state local. Target React 19+ and rely on the React Compiler rather than hand-written memoization (`useMemo`/`useCallback`/`React.memo`) — only add manual memoization where the compiler demonstrably can't help.
* **Next.js:** Use current App Router directives (`'use client'`, `'use server'`) deliberately — default to Server Components and only opt into a Client Component where interactivity actually requires it.
* **API Calls:** Enforce `next/lib/api.ts`'s `apiFetch` + `shared/config/api-routes.ts`'s `apiRoutes` for all backend interactions — never a new `fetch` pattern, and never hardcode a route path string. (A Hono RPC client (`hc<AppType>`) was tried first and abandoned: with ~140+ endpoints across every route file composed into one type, referencing it anywhere forced enough type instantiation to hang the editor. `apiRoutes` is plain generated path strings/functions instead, with zero dependency on Hono's types.)
* **UX:** Always implement loading, error, and empty states. Ensure semantic HTML and ARIA compliance.

**Backend (`hono/`)**

* **API Design:** Use arrow functions and strict RESTful conventions (GET, POST, PATCH, DELETE). Ensure consistent HTTP status codes and error messages.
* **Documentation:** Always update `hono/src/routes/API_DOCUMENTATION.md` and `API_TESTING_GUIDE.md` when altering routes, and reflect the change's status (done/outstanding) in `PROGRESS.md`.
* **New route files must be mounted, not just built:** a fully-built, fully-documented route file with zero `.route()` call anywhere in `index.ts` will type-check clean and pass review — it just silently 404s in production. When adding a route file, grep `index.ts` for it as a final check before calling the work done.