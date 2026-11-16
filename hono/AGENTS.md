# `hono/` — Hono API + Supabase

Repo rules: [`../AGENTS.md`](../AGENTS.md). Architecture:
[`API Client & Response Typing`](../docs/ARCHITECTURE-API-CLIENT.md),
[`Users, Auth, Roles & Access`](../docs/ARCHITECTURE-USERS-AUTH.md). Endpoint detail:
[`src/routes/API_DOCUMENTATION.md`](src/routes/API_DOCUMENTATION.md).

## Routes

* Arrow functions, RESTful paths, consistent status codes.
* Typed responses: the type lives in `shared/types/` and is applied at the route
  (`c.json<LoginResponse>(…)`). Never return a bare object.
* Mount it: a documented route file with no `.route()` call in `src/index.ts`
  type-checks clean and 404s in production. Grep `index.ts`, then run
  `corepack pnpm gen:api-endpoints`.
* Mirror the sibling with the same access shape (an own-resource table copies
  `profile-subjects.ts`, not `flags.ts`).
* Restriction checks (`profile_restrictions` / `is_restricted()`) block create and
  update only — never delete. Confirm the rule in `API_DOCUMENTATION.md` instead of
  inferring it from a similar endpoint.
* A route change updates `API_DOCUMENTATION.md` and `API_TESTING_GUIDE.md`.
* Auth is the Supabase session cookie, with no Bearer path. `/auth/login`,
  `/auth/callback` and `/auth/session` return the app-shaped `SessionUser`.
* `src/sanity-stub.d.ts` lets `hono/` import Sanity TypeGen types without
  `@sanity/client`. Keep it; do not install the package to silence the error.

## Three surfaces — never mix them

* Session routes: the default.
* `/api/sanity/*`: the Studio only — `SANITY_STUDIO_ORIGIN` plus a twenty-minute TOTP
  token, no session.
* `/api/admin/*`: the website admin — `WEBSITE_ORIGIN` plus the same kind of token,
  plus an admin session.
* Origin checks reject a foreign `Origin`. The Studio also rejects a missing one in
  production; the admin surface allows it because server-rendered pages call from Node.
* An admin-only route on a normal path takes `authMiddleware` **and**
  `requireAdminAccess` (`src/lib/admin-access.ts`). Without the second it is merely
  session-gated.

## Server-to-server

* Sign `${timestamp}.${body}` with `signRequest` and verify with `verifyRequest`
  (`shared/utils/request-signature.ts`, which rejects a timestamp older than ±5
  minutes). Used by the optimizer service and the web app's `/api/revalidate`. Never
  send a shared secret in a header.

## Supabase

* RLS is the authorization boundary, not the handler. Read the policies
  (`pg_policies`) or `supabase/migrations` before trusting a table's access shape —
  two similar tables can have opposite models (`professor_ratings` vs `professors`).
* Client per query, not per file: `createSupabaseClient` where RLS alone grants the
  caller; `createInternalSupabaseClient` only where no RLS path exists for that caller
  (catalog tables, `download_events`, notification and achievement inserts, role
  changes). Backwards means a silent 403 or a bypassed check.
* Never leak a raw Postgres error. Map at the route: `23505` → `409`, `23503` → `409`
  naming the dependent, `42501` → `403`, `P0001` → `400` with the message as-is.
* **`profiles.role` has no `authenticated` grant on purpose.** Table-wide UPDATE was
  revoked and only `(username, full_name)` granted back
  (`20261029120000_revoke_profile_avatar_url_write.sql`): re-granting the table would
  let any signed-in user promote themselves through PostgREST. Role changes run on the
  service-role client (`PATCH /api/admin/profiles/:id/role`); a new writable profile
  column means a column grant, never a table grant.

## Environment

* A new variable gets an entry in `ENV_REQUIREMENTS` (`src/server.ts`) with a
  `required` flag and the consequence of it missing. Names only, never values.
