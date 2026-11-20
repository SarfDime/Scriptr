# API Client & Response Typing

- **No Hono RPC client.** `hc<AppType>` over 140+ endpoints hung the editor's type
  checking; routes stay unchained `app.route(...)` statements.
- **Generated paths.** `shared/config/api-routes.ts` is generated from the mounted
  `app.routes` (never hand-edit; `corepack pnpm gen:api-endpoints` after a route change),
  with query helpers from `QUERY_CONFIG` (`shared/config/api.ts`). It exports `apiRoutes`
  and `ApiEndpoint` with no Hono dependency, so `sanity/` can import it.
- **`apiFetch`** (`next/lib/api/next-api.ts`) handles JSON/FormData, sends
  `credentials: 'include'` and throws one `ApiError` carrying the status. Its `catch`
  starts with `unstable_rethrow`, so a prerender or navigation that bails out is not
  logged (or swallowed) as an API outage. Per-domain wrappers live in
  `next/lib/api/*-api.ts`. A personalized server read forwards the request cookie
  (`getRequestCookieHeader`) through `cachedUnlessPersonalized`: tagged Data Cache when
  anonymous, `no-store` with a cookie.
- **No time-based revalidation.** Every cached read (`cachedPublicRead`,
  `cachedUnlessPersonalized` without a cookie, the public-profile reads, and
  `fetchSanityData`) is a `force-cache` entry with tags and no `revalidate`; it keeps
  working under Cache Components, and the cache key still outlives a deploy. Only
  `revalidateCacheTags` refreshes it, which POSTs the tags to `/api/revalidate`; a
  mutation that skips that call leaves its entries serving the build-time body. A Sanity
  read carries `sanity` plus the type tags of the documents it renders
  (`next/sanity/lib/utils.ts`, `shared/config/cache-tags.ts`), so a publish expires the
  pages that read that type.
- **Typed responses.** Shapes live in `shared/types/` and are applied at the route
  (`c.json<LoginResponse>(...)`). Anything a `hono/` route imports lives under `shared/`,
  never `next/types/`. Requests are guarded by runtime validation (`zValidator`).
