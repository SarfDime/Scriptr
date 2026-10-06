# Next.js Frontend

This directory contains the Next.js frontend, reusable components, styling, and
API test pages. The Hono service in `../hono` is the application backend.

## Development

From the repository root:

```bash
npm install
npm run dev:next
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
```

Do not expose private tokens through variables prefixed with `NEXT_PUBLIC_`.

## Commands

```bash
npm run dev:next
npm run check-types --workspace next
npm run build:next
```

## Calling the API

Never hand-write a `fetch` call against a hardcoded path. Two pieces work together:

- **`shared/config/api-routes.ts`** — auto-generated (do not hand-edit), exports
  `apiRoutes`, an object of path-builder functions/constants covering every
  route (e.g. `apiRoutes.scripts.popular(limit)`, `apiRoutes.universities.byId(id)`).
- **`next/lib/api.ts`**'s `apiFetch` — wraps `fetch` with JSON/FormData body
  handling and centralized error parsing (throws on non-2xx, with the
  server's `error`/`message` field as the thrown error's message).

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
(`app/scripts/[slug]/page.tsx`) is the reference example. User-facing text
goes in `shared/strings/<area>-strings.ts` (or `UI_STRINGS`), not inline.

## Conventions

Use the existing components, styles, and API client for new screens. See the
[styling guide](STYLING_GUIDE.md), [Hono API reference](../hono/src/routes/API_DOCUMENTATION.md),
and root [`AGENTS.md`](../AGENTS.md) for React/Next.js version and directive conventions.