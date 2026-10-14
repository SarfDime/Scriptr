# Vercel Deployment

Scriptr is deployed as two Git-connected Vercel projects in the
`Vercel team` team (`team-slug`):

| Project       | Vercel project ID                  | Repository root | Framework |
| ------------- | ---------------------------------- | --------------- | --------- |
| `scriptr-web` | `REDACTED_VERCEL_PROJECT` | `next`          | Next.js   |
| `scriptr-api` | `REDACTED_VERCEL_PROJECT` | `hono`          | Node.js   |

Both projects are connected to `this repository` and must allow source files
outside of their Root Directory because they import the root workspace and
`shared/` package files.

## Production URLs

- Web: `https://scriptr.uk`
- API: `https://api.scriptr.uk`
- API health check: `https://api.scriptr.uk/api`

The Vercel aliases remain useful for deployment inspection and preview traffic,
but they are not the production origins. Cookies cannot be shared between
`*.vercel.app` projects because `vercel.app` is a public suffix. Preview
deployments therefore do not have the production shared-cookie auth behavior.

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

- `NEXT_PUBLIC_API_URL` must be `https://api.scriptr.uk`.
- `NEXT_PUBLIC_SITE_URL` must be `https://scriptr.uk`.
- `NEXT_TELEMETRY_DISABLED=1` disables Next.js telemetry during builds.
- `REVALIDATE_SECRET` must equal the API's `REVALIDATE_SECRET`.

### `scriptr-api`

Use the variables from [`hono/.env.example`](hono/.env.example). In
Production:

- `COOKIE_DOMAIN` must be `.scriptr.uk` so the API cookie reaches the web host.
- `CORS_ORIGINS` must include the production origins and stable web aliases:
  - `https://scriptr.uk`
  - `*.scriptr.uk`
  - `https://scriptr-web-ivory.vercel.app`
  - `https://scriptr-web-team-slug.vercel.app`
  - `https://scriptr-web-git-main-team-slug.vercel.app`
- `NEXT_REVALIDATE_URL` must be
  `https://scriptr.uk/api/revalidate`.
- `REVALIDATE_SECRET` must equal the web project's value.
- Supabase, R2, and internal API credentials are required production secrets.

The hosted Sanity Studio must build with `SANITY_STUDIO_API_URL` set to
`https://api.scriptr.uk`. In Supabase Auth, set the Site URL to
`https://scriptr.uk` and add `https://scriptr.uk/auth/callback` to the allowed
redirect URLs.

Cloudflare Bot Fight Mode challenged Vercel's server-side requests to
`api.scriptr.uk` on 2026-10-14. The API hostname is now DNS-only, so those
requests go directly to Vercel while Bot Fight Mode remains enabled for the web
host. The API no longer receives Cloudflare proxy/WAF protection; rely on
Vercel and application-level controls for that hostname.

After changing production environment variables, redeploy both Vercel projects;
`NEXT_PUBLIC_API_URL` is inlined at build time. Users need to sign in once again
because their old session cookie is scoped to the Vercel API host.

## Verification

Before declaring a production deployment healthy:

```bash
curl -i https://api.scriptr.uk/api
curl -i https://api.scriptr.uk/api/auth/session
curl -i \
  -H 'Origin: https://scriptr.uk' \
  https://api.scriptr.uk/api/auth/session
curl -i https://scriptr.uk/
```

The API health and session requests must return JSON with HTTP `200`. The
CORS response must include:

```text
Access-Control-Allow-Origin: https://scriptr.uk
Access-Control-Allow-Credentials: true
```

Run these repository checks before deployment-related commits:

```bash
npm run check-types --workspace hono
npm run check-types --workspace next
npm run check-types --workspace sanity
npm run build --workspace next
```
