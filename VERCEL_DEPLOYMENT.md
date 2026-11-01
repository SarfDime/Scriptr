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

The projects remain rooted at `next/` and `hono/`. Their `vercel.json` files
set filtered install and build commands, overriding the corresponding project
dashboard commands. The commands run from the repository root so pnpm can read
`pnpm-workspace.yaml` and link `shared/`; each selects the app, its workspace
dependencies, and the lightweight root toolchain:

```text
cd .. && corepack pnpm install --frozen-lockfile --filter scriptr... --filter scriptr-next...
cd .. && corepack pnpm install --frozen-lockfile --filter scriptr... --filter @scriptr/api...
```

The `scriptr-web` build command is:

```text
cd .. && corepack pnpm --filter scriptr-next build
```

The `scriptr-api` build command is:

```text
cd .. && corepack pnpm --filter @scriptr/api check-types
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
- `NEXT_REVALIDATE_URL` must be the web project's **Vercel alias**, not the
  public hostname: `https://scriptr-web-team-slug.vercel.app/api/revalidate`.
  `scriptr.uk` sits behind the Cloudflare proxy, and Cloudflare does not pass
  the API's server-to-server request through to Vercel (the request never
  reaches the deployment, so every mutation silently left the cache stale —
  the homepage kept listing deleted scripts). Direct Vercel aliases are
  DNS-only and accept the webhook.
- `REVALIDATE_SECRET` must equal the web project's value, and must not be the
  `.env.example` value: the API logs a production warning when it is.
- Supabase, R2, and internal API credentials are required production secrets.
- `OPTIMIZER_URL` and `OPTIMIZER_SECRET` are optional and set together, once
  the file optimizer service is deployed. The secret signs API-to-service
  requests and must equal the service's own value.
- `R2_PUBLIC_URL` must be the bucket's public domain (a custom domain, or its
  `r2.dev` URL), with public access enabled on the bucket. Avatars live in
  `R2_BUCKET` under `avatars/{userId}.webp` and are served from there; without
  it avatar uploads answer `503`. Note this makes every object in the bucket
  readable by key: script keys stay unguessable (random UUIDs) but a leaked key
  no longer expires, unlike the signed URLs `GET /file-ops/get-file/*` hands out.
- Finalizing an upload runs the optimizer and can take tens of seconds, and the
  web client waits up to 120 s for it. The API project should run with Fluid
  compute (the default for projects created after 2025-04-23), whose default
  function duration is 300 s on every plan. Check this in the project settings:
  without it the function limit can be far lower than the client's timeout.

The hosted Sanity Studio must build with `SANITY_STUDIO_API_URL` set to
`https://api.scriptr.uk`. In Supabase Auth, set the Site URL to
`https://scriptr.uk` and add `https://scriptr.uk/auth/callback` to the allowed
redirect URLs.

Cloudflare Bot Fight Mode challenged Vercel's server-side requests to
`api.scriptr.uk` on 2026-10-14. The API hostname is now DNS-only, so those
requests go directly to Vercel while Bot Fight Mode remains enabled for the web
host. The API no longer receives Cloudflare proxy/WAF protection. On the API
Vercel project, Managed Bot Protection is set to `log` so server-side Node
requests are recorded without a browser challenge; automatic Vercel DDoS
mitigation remains enabled. The web project's protection settings are
unchanged.

The `scriptr-web` project has Vercel's **Auto-assign Custom Production Domains**
setting enabled. Vercel assigns `scriptr.uk` to each new production deployment;
no separate alias workflow or GitHub token is required.

Both projects use `git.deploymentEnabled` in their project-root `vercel.json`:
Git deployments are enabled only from `main` (production) and `staging` (a
Vercel Preview deployment); every other branch is disabled, so a feature branch
builds nothing. A branch can still be previewed on demand with the Vercel CLI
(`vercel` from `hono/` or `next/`), which bypasses the allowlist. The
project-level Ignored Build Step further limits automatic builds to commits
whose subjects start with `feat:` or `fix:` — `docs:`, `chore:` and merge
commits are skipped, so a docs-only push deploys nothing by design.

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
corepack pnpm --filter @scriptr/api check-types
corepack pnpm --filter scriptr-next check-types
corepack pnpm --filter scriptr-sanity check-types
corepack pnpm --filter scriptr-next build
```
