# Next.js frontend

The app, its components and its styles. The backend is `../hono`; rules for changing
this workspace are in [`AGENTS.md`](AGENTS.md).

```bash
corepack pnpm install     # from the repo root
corepack pnpm dev:next    # talks to http://localhost:8787 by default
```

## Environment

`next/.env`, from `.env.example`: `NEXT_PUBLIC_API_URL`,
`NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`,
`NEXT_PUBLIC_ENVIRONMENT_TYPE`, `SANITY_AUTH_TOKEN`, `REVALIDATE_SECRET`. Nothing
private gets a `NEXT_PUBLIC_` prefix.

`REVALIDATE_SECRET` is the signing key for `POST /api/revalidate`, which the API calls to
expire cache tags. The call carries `x-revalidate-timestamp` and
`x-revalidate-signature` (HMAC over `${timestamp}.${body}`), so the secret never travels
and a captured request expires after five minutes; a mismatch with `hono/.env` is `401`.
The route is limited to 30 calls a minute per IP, and it expires tags immediately
(`revalidateTag(tag, { expire: 0 })`) so the first request after a mutation is never
stale.

## Commands

```bash
corepack pnpm dev:next
corepack pnpm --filter scriptr-next check-types
corepack pnpm build:next
```

## Calling the API

`apiRoutes` (`shared/config/api-routes.ts`, generated — never hand-edited) supplies every
path; `apiFetch` (`next/lib/api/next-api.ts`) wraps `fetch` with JSON/FormData bodies,
`credentials: 'include'` and one `ApiError` shape on non-2xx. Per-domain wrappers live in
`next/lib/api/*-api.ts`.

```ts
apiFetch<ScriptsResponse>(apiRoutes.scripts.popular(limit), {
  next: { tags: [SCRIPT_CACHE_TAGS.popular()] },
})
```

A Hono RPC client (`hc<AppType>`) was dropped: referencing the full route type was enough
to hang the TypeScript server. Generated paths plus each route's own runtime validation
replace it.

## Structuring a page

`page.tsx` awaits `params`, calls a loader in `next/lib/<feature>-page.ts` (fetching,
cookies, 404s) that returns a view model typed in `next/types/components/`, and composes
small components from `components/<area>/<feature>/`. Reference:
`app/[locale]/(study)/study/[siteSlug]/scripts/[scriptSlug]/page.tsx`.

## Conventions

Reuse the existing components, styles and API client. [`STYLING_GUIDE.md`](STYLING_GUIDE.md)
for UI, [`AGENTS.md`](AGENTS.md) for Next.js/React rules, and
[`../hono/src/routes/API_DOCUMENTATION.md`](../hono/src/routes/API_DOCUMENTATION.md) for
the endpoints.
