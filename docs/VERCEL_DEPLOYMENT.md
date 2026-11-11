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
[`hono/src/index.ts`](../hono/src/index.ts) exports:

```ts
export default getRequestListener(app.fetch)
```

Do not replace this with `handle(app)` or `app`. Those values return a Web
`Response`, which Vercel's Node runtime ignores and then times out.
[`hono/src/server.ts`](../hono/src/server.ts) remains the local development
server only.

The Hono app uses `.basePath('/api')`. Its root health endpoint is
`GET /api`, without a required trailing slash.

## Production Environment Synchronization

Store values in Vercel Environment Variables; never add them to Git.

### `scriptr-web`

Use the variables from [`next/.env.example`](../next/.env.example). In
Production:

- `NEXT_PUBLIC_API_URL` must be `https://api.scriptr.uk`.
- `NEXT_PUBLIC_SITE_URL` must be `https://scriptr.uk`.
- `NEXT_TELEMETRY_DISABLED=1` disables Next.js telemetry during builds.
- `REVALIDATE_SECRET` must equal the API's `REVALIDATE_SECRET`. It is a signing
  key, not a header value: the API sends `x-revalidate-timestamp` +
  `x-revalidate-signature` and this project verifies the HMAC, so the secret
  never crosses the wire.
- `SANITY_REVALIDATE_SECRET` is the bearer secret the Sanity publish webhook
  sends in `x-sanity-webhook-secret`; the webhook is configured with the same
  value (see [`sanity/README.md`](../sanity/README.md#publish-webhook)). Sanity
  cannot sign a request, so unlike `REVALIDATE_SECRET` this one does cross the
  wire and belongs in the webhook header. Without it
  `POST /api/sanity/revalidate` answers `503`, and a mismatch answers `401` —
  either way an editorial publish only reaches readers on the next deploy.

### `scriptr-api`

Use the variables from [`hono/.env.example`](../hono/.env.example). In
Production:

- `COOKIE_DOMAIN` must be `.scriptr.uk` so the API cookie reaches the web host.
- `CORS_ORIGINS` is the only origin allowlist in production (the localhost dev
  ports are added automatically only when `NODE_ENV` is not `production`), so it
  must include the production origins, stable web aliases and the hosted Studio:
  - `https://scriptr.uk`
  - `*.scriptr.uk`
  - `https://scriptr-web.vercel.app`
  - `https://scriptr-web-ivory.vercel.app`
  - `https://scriptr-web-team-slug.vercel.app`
  - `https://scriptr-web-git-main-team-slug.vercel.app`
  - `https://scriptr-web-git-staging-team-slug.vercel.app`
  - `https://scriptr.sanity.studio`
  Leaving the Studio out makes every sync/delete action fail its preflight with
  `(Reason: CORS request did not succeed)`; a `403 Forbidden` after that instead
  means `ADMIN_TOTP_SECRET` is missing on the API (the Studio itself carries no
  secret).
- `NEXT_REVALIDATE_URL` must be the web project's **Vercel alias**, not the
  public hostname: `https://scriptr-web-team-slug.vercel.app/api/revalidate`.
  `scriptr.uk` sits behind the Cloudflare proxy, and Cloudflare does not pass
  the API's server-to-server request through to Vercel (the request never
  reaches the deployment, so every mutation silently left the cache stale —
  the homepage kept listing deleted scripts). Direct Vercel aliases are
  DNS-only and accept the webhook.
- `REVALIDATE_SECRET` must equal the web project's value, and must not be the
  `.env.example` value: the API's startup report and `revalidateCacheTags` both
  call that out in production.
- `OPTIMIZER_SECRET` must equal the optimizer service's Secret Manager value;
  it signs every `/optimize` call the same way.
- Supabase, R2, and the API secrets are required production values:
  `SITEMAP_SECRET` (must match the web project's) and `ADMIN_TOTP_SECRET` (the
  base32 TOTP secret generated with `corepack pnpm --filter @scriptr/api admin:totp`,
  also enrolled in an authenticator app).
- `SANITY_STUDIO_ORIGIN` (`https://scriptr.sanity.studio`) and `WEBSITE_ORIGIN`
  (the site's public hostname) pin the two non-session surfaces to their caller.
  Both must also appear in `CORS_ORIGINS`. Leaving either unset makes its
  surface answer `403` in production. The `staging` branch is not used, so only
  Production carries these values; enabling staging later means adding all four
  (`SANITY_STUDIO_ORIGIN`, `WEBSITE_ORIGIN`, `ADMIN_TOTP_SECRET`,
  `SITEMAP_SECRET`) plus `CORS_ORIGINS` to the **Preview** environment.
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
builds nothing. `main-sanity` is also disabled by name, not just by the `**`
fallback: it only exists to trigger `deploy-sanity.yaml`, and the API/web have
nothing to deploy for it, so a stray edit to `**` must not silently start
building it. A branch can still be previewed on demand with the Vercel CLI
(`vercel` from `hono/` or `next/`), which bypasses the allowlist. The
project-level Ignored Build Step further limits automatic builds to commits
whose subjects start with `feat:` or `fix:` — `docs:`, `chore:` and merge
commits are skipped, so a docs-only push deploys nothing by design.

After changing production environment variables, redeploy both Vercel projects;
`NEXT_PUBLIC_API_URL` is inlined at build time. Users need to sign in once again
because their old session cookie is scoped to the Vercel API host.

## Deploying the access refactor

The three non-session surfaces (`/api/sanity/*`, `/api/admin/*`, `/api/sitemap/scripts`) replaced `x-internal-secret`. A half-deployed state has a short, operator-only failure window, so deploy in this order:

1. **`scriptr-web`** — it verifies the new signed `/api/revalidate` calls, so deploying it first means the old API's unsigned calls are simply rejected (cache stays stale for a few minutes) instead of the reverse.
2. **`scriptr-api`** — this is the switchover. Until it lands, `/api/sanity/*` and `/api/admin/*` do not exist; after it lands, `/api/internal/*` is gone, so an open Studio tab running the old bundle fails its sync/delete actions. Reload the Studio once the API is Healthy.
3. **Sanity Studio** (`corepack pnpm deploy:sanity`) — the bundle no longer contains any secret, so this must be re-published for the TOTP flow to reach the operator.

Environment changes required by the deploy:

| Project | Add | Remove |
| ------- | --- | ------ |
| `scriptr-api` | `ADMIN_TOTP_SECRET`, `SANITY_STUDIO_ORIGIN`, `WEBSITE_ORIGIN`, `SITEMAP_SECRET`, refreshed `CORS_ORIGINS` | `INTERNAL_API_SECRET` |
| `scriptr-web` | `SITEMAP_SECRET` (same value) | `INTERNAL_API_SECRET`, `SANITY_STUDIO_INTERNAL_SECRET` |
| Sanity Studio | — | `SANITY_STUDIO_INTERNAL_SECRET` (in `sanity/.env.production`) and from the deploy workflows' `env:` blocks |

`WEBSITE_ORIGIN` must be the **exact** hostname users load — `https://scriptr.uk`, not a Vercel alias — because it is compared against the browser's `Origin` on every admin call. Add both origins to `CORS_ORIGINS` as well; the check runs after the preflight, so a missing entry fails earlier and less clearly.

**Rotate the old `INTERNAL_API_SECRET`** unless you can prove nothing else ever reused that value: it was readable by anyone who loaded the Studio, and any deployment still running the previous code keeps accepting it.

Post-deploy checks, in order:

```bash
# 401 (route exists, token missing) — not 404, not 403
curl -s -o /dev/null -w '%{http_code}\n' https://api.scriptr.uk/api/sanity/universities

# 404 — the old surface is gone
curl -s -o /dev/null -w '%{http_code}\n' https://api.scriptr.uk/api/internal/universities

# 403 — the route-scoped sitemap secret is enforced
curl -s -o /dev/null -w '%{http_code}\n' https://api.scriptr.uk/api/sitemap/scripts

# 401 — unsigned revalidation is rejected
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://scriptr.uk/api/revalidate
```

Then, signed in as an admin: `/admin` shows the code form; after entering a code the flag queue loads, and the Studio's "Sync with Database" works on the same code.

## Rotating the shared secrets

These values are shared with another deployment or configuration, and each only
works when **both** sides change. Rotate them on a schedule and whenever someone
with access leaves; use a unique random value per environment
(`openssl rand -base64 32`), never the `.env.example` placeholder.

| Secret | Held by | Rotation order |
| ------ | ------- | -------------- |
| `REVALIDATE_SECRET` | `scriptr-api`, `scriptr-web` | Add the new value to **both** projects, redeploy both, then remove the old one. A mismatch shows up as `401` on `/api/revalidate` and the API logs `Cache revalidation failed with status 401`. |
| `OPTIMIZER_SECRET` | `scriptr-api`, Cloud Run (`optimizer-secret`) | Create a new Secret Manager version and deploy the service, then set the same value on the API and redeploy. Between the two deploys uploads fail with `503` — finalize fails closed rather than storing files unoptimized. |
| `SITEMAP_SECRET` | `scriptr-api`, `scriptr-web` | Same as `REVALIDATE_SECRET`. A mismatch silently drops script URLs from `/sitemap.xml` (the API answers `403`, the web app logs a warning). |
| `ADMIN_TOTP_SECRET` | `scriptr-api` only | Generate with `corepack pnpm --filter @scriptr/api admin:totp`, set it, and re-enrol the new `otpauth` URI in the authenticator app. Every issued token stops working immediately; the old secret is dead as soon as the API restarts. |
| `SANITY_REVALIDATE_SECRET` | `scriptr-web`, the Sanity publish webhook | Set the new value on the web project, redeploy it, then update the webhook's `x-sanity-webhook-secret` header in Sanity. Between the two, every publish answers `401` and the cache waits for the next deploy. |

**A version is not `latest` by being enabled.** `latest` means the highest
version *number that exists*, whatever its state. Disabling or destroying a bad
version does not move `latest` back — it makes the next mount fail with
`FAILED_PRECONDITION` (Cloud Run) or an access error. Recover by adding a new
version that holds the good value, piping it so it is never echoed:

```bash
gcloud secrets versions access <good-version> --secret=<name> \
  | gcloud secrets versions add <name> --data-file=-
```

And never run that `add` with an unset variable: `<<< "$NEW_KEY"` sends a bare
newline, which Cloudflare will reject but Cloud Run will happily mount as an
empty secret. Check the length first — `printf '%s' "$NEW_KEY" | wc -c` should be
non-zero — and remember that the running revision keeps the values it was
deployed with until the next deploy.

Two rules that make rotation uneventful:

1. **Deploy the consumer first when it only verifies** (`scriptr-web` for
   revalidation, the optimizer service for signing), so there is no window where
   a new signer talks to an old verifier.
2. **Check the startup report after deploying** — every app prints which
   variables are set and which are missing, names only. A half-rotation shows up
   there and in the first failing request.

## Verification

Before declaring a production deployment healthy:

```bash
curl -i https://api.scriptr.uk/api
curl -i https://api.scriptr.uk/api/auth/session
curl -i \
  -H 'Origin: https://scriptr.uk' \
  https://api.scriptr.uk/api/auth/session
curl -i https://scriptr.uk/
# 401 — the Sanity webhook route rejects an unsigned publish (503 means
# SANITY_REVALIDATE_SECRET is missing from the web project)
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://scriptr.uk/api/sanity/revalidate
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
