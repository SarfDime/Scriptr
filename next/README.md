# Next.js Frontend

This directory contains the Next.js frontend, reusable components, and styling. The Hono service in `../hono` is the application backend.

## Development

From the repository root:

```bash
corepack pnpm install
corepack pnpm dev:next
```

The app runs with Next.js and connects to `http://localhost:8787` by default.

## Environment

Configure the frontend in `next/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8787
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=your_dataset
NEXT_PUBLIC_ENVIRONMENT_TYPE=development
SANITY_AUTH_TOKEN=your_token
REVALIDATE_SECRET=development_secret_key
```

`REVALIDATE_SECRET` is the signing key for `POST /api/revalidate`, which the
Hono API calls to invalidate cache tags. The API sends `x-revalidate-timestamp`
and `x-revalidate-signature` (an HMAC over `${timestamp}.${body}`), so the secret
never travels and a captured request expires after five minutes; a mismatch with
`hono/.env` answers `401`. The route is also limited to 30 calls a minute per IP.
Tags are
expired immediately (`revalidateTag(tag, { expire: 0 })`), not
stale-while-revalidate, so the first request after a mutation never serves old
data.

Do not expose private tokens through variables prefixed with `NEXT_PUBLIC_`.

## Commands

```bash
corepack pnpm dev:next
corepack pnpm --filter scriptr-next check-types
corepack pnpm build:next
```

## Calling the API

Never hand-write a `fetch` call against a hardcoded path. Two pieces work together:

- **`shared/config/api-routes.ts`** — auto-generated (do not hand-edit), exports
  `apiRoutes`, an object of path-builder functions/constants covering every
  route (e.g. `apiRoutes.scripts.popular(limit)`, `apiRoutes.universities.byId(id)`).
- **`next/lib/api/next-api.ts`**'s `apiFetch` — wraps `fetch` with JSON/FormData
  body handling, `credentials: 'include'`, and centralized error parsing (throws
  an `ApiError` on non-2xx, with the server's `error`/`message` field as its
  message and the HTTP status on `.status`). Per-domain wrappers live in
  `next/lib/api/*-api.ts`.

```ts
apiFetch<ScriptsResponse>(apiRoutes.scripts.popular(limit), {
  next: { tags: [SCRIPT_CACHE_TAGS.popular()] },
})
```

A Hono RPC client (`hc<AppType>`, full compile-time request/response
type-checking against the live route tree) was tried first and dropped —
with the app's full route count, referencing that type anywhere was enough
to hang the TypeScript server. `apiRoutes`/`apiFetch` trade that away for
something that scales: plain generated path strings, checked at the
boundary by each route's own runtime validation instead of the client's
type system.

## Structuring a page

Keep `page.tsx` thin: await `params`, call a loader from
`next/lib/<feature>-page.ts` that does the fetching and returns a view model
(typed in `next/types/components/`), and compose small components from
`components/<area>/<feature>/`. The script detail page
(`app/(study)/study/[siteSlug]/scripts/[scriptSlug]/page.tsx`) is the reference
example. User-facing text goes in `shared/strings/<area>-strings.ts` (or
`UI_STRINGS`), not inline.

## Conventions

Use the existing components, styles, and API client for new screens. See the
[styling guide](STYLING_GUIDE.md), [Hono API reference](../hono/src/routes/API_DOCUMENTATION.md),
and [`docs/AGENTS-FRONTEND.md`](../docs/AGENTS-FRONTEND.md) for React/Next.js version and directive conventions.