# Vercel Deployment

Scriptr is deployed as two Git-connected Vercel projects in the
`Vercel team` team (`team-slug`):

| Project | Vercel project ID | Repository root | Framework |
| --- | --- | --- | --- |
| `scriptr-web` | `REDACTED_VERCEL_PROJECT` | `next` | Next.js |
| `scriptr-api` | `REDACTED_VERCEL_PROJECT` | `hono` | Node.js |

Both projects are connected to `this repository` and must allow source files
outside of their Root Directory because they import the root workspace and
`shared/` package files.

## Production URLs

- Web: `https://scriptr-web-ivory.vercel.app`
- API: `https://scriptr-api.vercel.app`
- API health check: `https://scriptr-api.vercel.app/api`

`scriptr-web.vercel.app` is not available to this team. The `ivory` alias is
the stable production web alias and must be used as the canonical web origin.

Deployment Protection is disabled for both public projects. Enabling it on the
API causes server-side and browser API calls to receive a Vercel HTML
protection response instead of JSON.

## Project Commands

Both projects install from the repository root:

```text
npm install --prefix .. --include=dev
```

`scriptr-web` builds with:

```text
npm run --prefix .. build:next
```

`scriptr-api` validates its deployment with:

```text
npx tsc --noEmit -p tsconfig.json
```

## API Runtime Contract

The API is deployed with Vercel's **Node.js** framework preset, not the Hono
preset. The Hono preset's isolated TypeScript pass cannot resolve the generated
Sanity module augmentation in this monorepo.

Vercel's Node runtime requires a `(req, res)` listener. Therefore
[`hono/src/index.ts`](hono/src/index.ts) exports:

```ts
export default getRequestListener(app.fetch)
```

Do not replace this with `handle(app)` or `app`. Those values return a Web
`Response`, which Vercel's Node runtime ignores and then times out.
[`hono/src/server.ts`](hono/src/server.ts) remains the local development
server only.

The Hono app uses `.basePath('/api')`. Its root health endpoint is
`GET /api`, without a required trailing slash.

## Production Environment Synchronization

Store values in Vercel Environment Variables; never add them to Git.

### `scriptr-web`

Use the variables from [`next/.env.example`](next/.env.example). In
Production:

- `NEXT_PUBLIC_API_URL` must be `https://scriptr-api.vercel.app`.
- `NEXT_PUBLIC_SITE_URL` must be `https://scriptr-web-ivory.vercel.app`.
- `NEXT_TELEMETRY_DISABLED=1` disables Next.js telemetry during builds.
- `REVALIDATE_SECRET` must equal the API's `REVALIDATE_SECRET`.

### `scriptr-api`

Use the variables from [`hono/.env.example`](hono/.env.example). In
Production:

- `CORS_ORIGINS` must include all stable web aliases:
  - `https://scriptr-web-ivory.vercel.app`
  - `https://scriptr-web-team-slug.vercel.app`
  - `https://scriptr-web-git-main-team-slug.vercel.app`
- `NEXT_REVALIDATE_URL` must be
  `https://scriptr-web-ivory.vercel.app/api/revalidate`.
- `REVALIDATE_SECRET` must equal the web project's value.
- Supabase, R2, and internal API credentials are required production secrets.

Whenever a production URL changes, update the web API URL, API CORS origins,
and API revalidation URL together, then redeploy both projects.

## Verification

Before declaring a production deployment healthy:

```bash
curl -i https://scriptr-api.vercel.app/api
curl -i https://scriptr-api.vercel.app/api/auth/session
curl -i \
  -H 'Origin: https://scriptr-web-ivory.vercel.app' \
  https://scriptr-api.vercel.app/api/auth/session
curl -i https://scriptr-web-ivory.vercel.app/
```

The API health and session requests must return JSON with HTTP `200`. The
CORS response must include:

```text
Access-Control-Allow-Origin: https://scriptr-web-ivory.vercel.app
Access-Control-Allow-Credentials: true
```

Run these repository checks before deployment-related commits:

```bash
npm run check-types --workspace hono
npm run check-types --workspace next
npm run check-types --workspace sanity
npm run build --workspace next
```
