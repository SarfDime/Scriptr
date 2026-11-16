# API Client & Response Typing

* **No Hono RPC client.** `hc<AppType>` over 140+ endpoints hung the editor's type
  checking; routes stay unchained `app.route(...)` statements.
* **Generated paths.** `shared/config/api-routes.ts` is generated from the mounted
  `app.routes` (never hand-edit; `corepack pnpm gen:api-endpoints` after a route change),
  with query helpers from `QUERY_CONFIG` (`shared/config/api.ts`). It exports `apiRoutes`
  and `ApiEndpoint` with no Hono dependency, so `sanity/` can import it.
* **`apiFetch`** (`next/lib/api/next-api.ts`) handles JSON/FormData, sends
  `credentials: 'include'` and throws one `ApiError` carrying the status. Per-domain
  wrappers live in `next/lib/api/*-api.ts`. A personalized server read forwards the
  request cookie (`getRequestCookieHeader`) through `cachedUnlessPersonalized`: tagged
  Data Cache when anonymous, `no-store` with a cookie.
* **No time-based revalidation.** Every cached read (`cachedPublicRead`,
  `cachedUnlessPersonalized` without a cookie, the public-profile reads) is a `force-cache`
  entry with tags and no `revalidate`. Only `revalidateCacheTags` refreshes it, which
  POSTs the tags to `/api/revalidate`; a mutation that skips that call leaves its entries
  serving the build-time body. Sanity reads share one `sanity` tag
  (`next/sanity/lib/utils.ts`) and are expected to arrive with the next rebuild.
* **Typed responses.** Shapes live in `shared/types/` and are applied at the route
  (`c.json<LoginResponse>(...)`). Anything a `hono/` route imports lives under `shared/`,
  never `next/types/`. Requests are guarded by runtime validation (`zValidator`).
