# Backend (`hono/`)

The root [Global Rules](../AGENTS.md#global-rules) still apply. Architecture: [API Client & Response Typing](ARCHITECTURE-API-CLIENT.md) and [Users, Auth, Roles & Access](ARCHITECTURE-USERS-AUTH.md).

* Arrow functions, RESTful conventions, consistent status codes.
* **Typed responses:** the response type lives in `shared/types/` and is applied at the route (`c.json<LoginResponse>(...)`). New or changed routes add or update the shared type — never return a bare object.
* **Mount new route files:** a documented route file with no `.route()` call in `hono/src/index.ts` type-checks clean and 404s in production. Grep `index.ts` before calling the work done, then `corepack pnpm gen:api-endpoints`.
* Mirror an existing sibling with the same access shape (a new own-resource table copies `profile-subjects.ts`, not `flags.ts`) instead of inventing a pattern.
* Restriction checks (`profile_restrictions`/`is_restricted()`) block create/update only — never delete/remove. Confirm against [`ARCHITECTURE-USERS-AUTH.md`](ARCHITECTURE-USERS-AUTH.md) rather than inferring from a similar endpoint.
* Always update [`API_DOCUMENTATION.md`](../hono/src/routes/API_DOCUMENTATION.md) and [`API_TESTING_GUIDE.md`](../hono/src/routes/API_TESTING_GUIDE.md) when a route changes.
* `hono/src/sanity-stub.d.ts` lets `hono/` import Sanity TypeGen types without `@sanity/client`; don't remove it or install the package to silence the error.
* Auth is the Supabase session cookie only — no Bearer-token path. `/auth/login`, `/auth/callback` and `/auth/session` return the app-shaped `SessionUser`.
