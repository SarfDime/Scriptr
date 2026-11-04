# Backend (`hono/`)

The root [Global Rules](../AGENTS.md#global-rules) still apply. Architecture: [API Client & Response Typing](ARCHITECTURE-API-CLIENT.md) and [Users, Auth, Roles & Access](ARCHITECTURE-USERS-AUTH.md).

* Arrow functions, RESTful conventions, consistent status codes.
* **Signed server-to-server calls:** the API signs `${timestamp}.${body}` with `signRequest` (`shared/utils/request-signature.ts`) and the callee verifies with `verifyRequest`, which also rejects a timestamp older than ±5 minutes. Used for the optimizer service and the web app's `/api/revalidate`. Never send a shared secret in a header.
* **New env var → startup checklist:** add it to `ENV_REQUIREMENTS` in `hono/src/server.ts` with a `required` flag and the consequence of it being missing. The report prints names only, so never add a value to it.
* **Typed responses:** the response type lives in `shared/types/` and is applied at the route (`c.json<LoginResponse>(...)`). New or changed routes add or update the shared type — never return a bare object.
* **Mount new route files:** a documented route file with no `.route()` call in `hono/src/index.ts` type-checks clean and 404s in production. Grep `index.ts` before calling the work done, then `corepack pnpm gen:api-endpoints`.
* **Three surfaces, don't mix them:** session routes (the default), `/api/sanity/*` (the Studio only — `SANITY_STUDIO_ORIGIN` + a ten-minute TOTP token, no session), and `/api/admin/*` (the website's admin surface — `WEBSITE_ORIGIN` + the same kind of token, plus an admin session). A Studio route must never appear on a session path, and a website route must never appear under `/api/sanity`. Origin checks reject a foreign `Origin`; the Studio also rejects a missing one in production, while the admin surface allows it because server-rendered pages call from Node.
* **Admin-only routes on normal paths also take `requireAdminAccess`** (`hono/src/lib/admin-access.ts`) after `authMiddleware`: origin pinning plus the unlock token. Adding an admin route without it leaves it session-only, which is exactly the gap this closed — grep the route file for `requireAdminAccess` when you touch an admin handler.
* Mirror an existing sibling with the same access shape (a new own-resource table copies `profile-subjects.ts`, not `flags.ts`) instead of inventing a pattern.
* Restriction checks (`profile_restrictions`/`is_restricted()`) block create/update only — never delete/remove. Confirm against [`ARCHITECTURE-USERS-AUTH.md`](ARCHITECTURE-USERS-AUTH.md) rather than inferring from a similar endpoint.
* Always update [`API_DOCUMENTATION.md`](../hono/src/routes/API_DOCUMENTATION.md) and [`API_TESTING_GUIDE.md`](../hono/src/routes/API_TESTING_GUIDE.md) when a route changes.
* `hono/src/sanity-stub.d.ts` lets `hono/` import Sanity TypeGen types without `@sanity/client`; don't remove it or install the package to silence the error.
* Auth is the Supabase session cookie only — no Bearer-token path. `/auth/login`, `/auth/callback` and `/auth/session` return the app-shaped `SessionUser`.
