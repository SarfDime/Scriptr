# Vercel Deployment

Two Git-connected Vercel projects in the `Vercel team` team (`team-slug`):

| Project | Project ID | Root | Framework |
| --- | --- | --- | --- |
| `scriptr-web` | `REDACTED_VERCEL_PROJECT` | `next` | Next.js |
| `scriptr-api` | `REDACTED_VERCEL_PROJECT` | `hono` | Node.js |

Both connect to `this repository` and must allow source files outside their root
directory, because they import the root workspace and `shared/`.

Production: web `https://scriptr.uk`, API `https://api.scriptr.uk`, API health
`https://api.scriptr.uk/api`. The Vercel aliases stay useful for inspection and preview
traffic but are not production origins, and cookies cannot be shared between
`*.vercel.app` projects (`vercel.app` is a public suffix). Keep Deployment Protection off:
on the API it makes server-side and browser calls receive Vercel's HTML instead of JSON.

## Project commands

`next/vercel.json` and `hono/vercel.json` override the dashboard commands. They run from
the repository root so pnpm can read `pnpm-workspace.yaml` and link `shared/`:

```text
cd .. && corepack pnpm install --frozen-lockfile --filter scriptr... --filter scriptr-next...
cd .. && corepack pnpm --filter scriptr-next build

cd .. && corepack pnpm install --frozen-lockfile --filter scriptr... --filter @scriptr/api...
cd .. && corepack pnpm --filter @scriptr/api check-types
```

## API runtime contract

The API uses Vercel's **Node.js** preset, not the Hono preset: the Hono preset's isolated
TypeScript pass cannot resolve the generated Sanity module augmentation in this monorepo.
The Node runtime needs a `(req, res)` listener, so
[`hono/src/index.ts`](../hono/src/index.ts) exports

```ts
export default getRequestListener(app.fetch)
```

`handle(app)` or `app` return a Web `Response` that the Node runtime ignores, then times
out. [`hono/src/server.ts`](../hono/src/server.ts) is the local dev server only. The app
uses `.basePath('/api')`, with the health endpoint at `GET /api` (no trailing slash).

## Environment

Values live in Vercel Environment Variables — never in Git.

### `scriptr-web`

From [`next/.env.example`](../next/.env.example); in Production:

- `NEXT_PUBLIC_API_URL=https://api.scriptr.uk`.
- `NEXT_PUBLIC_SITE_URL=https://scriptr.uk` — also the base every study hostname derives
  from (`<siteSlug>.scriptr.uk`), so it decides each study's address and canonical.
- `NEXT_TELEMETRY_DISABLED=1`.
- `REVALIDATE_SECRET` must equal the API's. It is a signing key: the API sends
  `x-revalidate-timestamp` + `x-revalidate-signature` and this project verifies the HMAC,
  so it never crosses the wire.
- `SANITY_REVALIDATE_SECRET` is the bearer secret the Sanity publish webhook sends in
  `x-sanity-webhook-secret` ([`sanity/README.md`](../sanity/README.md#publish-webhook)).
  Sanity cannot sign, so this one does cross the wire. Missing → `503` on
  `POST /api/sanity/revalidate`; mismatched → `401`. Either way a publish waits for the
  next deploy.

### `scriptr-api`

From [`hono/.env.example`](../hono/.env.example); in Production:

- `COOKIE_DOMAIN=.scriptr.uk` so the API cookie reaches the web host.
- `CORS_ORIGINS` is the only allowlist in production (localhost dev ports are added only
  when `NODE_ENV` is not `production`), so it must list:
  `https://scriptr.uk`, `*.scriptr.uk`, `https://scriptr-web.vercel.app`,
  `https://scriptr-web-ivory.vercel.app`, `https://scriptr-web-team-slug.vercel.app`,
  `https://scriptr-web-git-main-team-slug.vercel.app`,
  `https://scriptr-web-git-staging-team-slug.vercel.app`,
  `https://scriptr.sanity.studio`. Without the Studio entry every sync/delete action fails
  its preflight (`Reason: CORS request did not succeed`); a later `403` means
  `ADMIN_TOTP_SECRET` is missing on the API.
- `NEXT_REVALIDATE_URL` must be the web project's **Vercel alias**,
  `https://scriptr-web-team-slug.vercel.app/api/revalidate`, not the public hostname:
  Cloudflare does not pass the API's server-to-server request through to Vercel, so the
  webhook silently never runs and mutations leave the cache stale.
- `VERCEL_AUTOMATION_BYPASS_SECRET` is how that alias is reachable at all: Vercel
  Authentication answers `401` on a deployment URL before the route runs. Set it to the web
  project's Protection Bypass for Automation secret (Project Settings → Deployment
  Protection); unset, every revalidation is a `401` and no cached read ever expires.
- `REVALIDATE_SECRET` must match the web project and must not be the `.env.example` value
  (the startup report and `revalidateCacheTags` both flag it in production).
- `OPTIMIZER_URL` and `OPTIMIZER_SECRET` are optional but set together; the secret must
  equal the optimizer's Secret Manager value.
- `SITEMAP_SECRET` (matching the web project) and `ADMIN_TOTP_SECRET` (the base32 secret
  from `corepack pnpm --filter @scriptr/api admin:totp`, also enrolled in an authenticator
  app), plus the Supabase and R2 values.
- `SANITY_STUDIO_ORIGIN=https://scriptr.sanity.studio` and `WEBSITE_ORIGIN` (the exact host
  readers load, `https://scriptr.uk` — never an alias, since it is compared against the
  browser's `Origin`) pin the two non-session surfaces. Both must be in `CORS_ORIGINS`;
  either unset makes its surface answer `403`. Only Production carries these: the `staging`
  branch is unused, and enabling it means adding all four plus `CORS_ORIGINS` to Preview.
- `R2_PUBLIC_URL` is the bucket's public domain, with public access enabled. Avatars live
  at `avatars/{userId}.webp` in `R2_BUCKET`; without it avatar uploads answer `503`. Every
  object then becomes readable by key — script keys stay unguessable UUIDs, but a leaked
  key no longer expires, unlike the signed URLs `GET /file-ops/get-file/*` hands out.
- Finalizing an upload runs the optimizer and can take tens of seconds while the client
  waits up to 120 s. Keep the project on Fluid compute (default for projects created after
  2025-04-23, 300 s per function on every plan); a lower limit fails the request.

The hosted Studio builds with `SANITY_STUDIO_API_URL=https://api.scriptr.uk`. In Supabase
Auth, the Site URL is `https://scriptr.uk` and `https://scriptr.uk/auth/callback` is an
allowed redirect URL.

### Study hostnames

One build and one deployment serve the apex and every study host; `next/next.config.ts`
rewrites a host's paths onto the study tree and redirects `scriptr.uk/study/lbe/*`. The
mapping and the three attach steps (Vercel domain → proxied `CNAME` → certificate) are in
[`ARCHITECTURE-STUDY-DOMAINS.md`](ARCHITECTURE-STUDY-DOMAINS.md). Two deployment values
matter: `COOKIE_DOMAIN=.scriptr.uk` and `CORS_ORIGINS=*.scriptr.uk` keep the session and
calls working when the reader moves between apex and study host. A preview deployment
cannot exercise a study host — its `NEXT_PUBLIC_SITE_URL` is a `*.vercel.app` alias — so
test on `http://lbe.localhost:3000`.

### Domains, protection and branches

- `scriptr-web` has **Auto-assign Custom Production Domains** on: Vercel assigns
  `scriptr.uk` to each production deployment, with no alias workflow or token.
- `api.scriptr.uk` is **DNS-only**: Cloudflare Bot Fight Mode challenged Vercel's
  server-side requests to it, so the API now bypasses the proxy and receives no WAF
  protection. Vercel's Managed Bot Protection is `log` on the API project (server-side Node
  requests recorded, no browser challenge) and automatic DDoS mitigation stays on.
- Each project's `git.deploymentEnabled` allows exactly the branches it deploys: web from
  `main` (production) and `staging` (preview); API from `main-api` alone, which is set as
  its production branch in **Settings → Environments → Production → Branch Tracking** (not
  the Git page; the REST API cannot set it). `main`, `staging` and `main-sanity` are
  disabled by name as well as by the `**` fallback, so a web release never starts an API
  build and a Sanity-only push deploys nothing.
- A branch can still be previewed with `vercel` from `hono/` or `next/`, which bypasses the
  allowlist. The Ignored Build Step limits automatic builds to commit subjects starting
  with `feat:` or `fix:`, so `docs:` and `chore:` deploy nothing. **A squash merge takes
  the PR title as the subject**, so the prefix belongs on the PR title too; otherwise the
  deployment is reported as *Canceled* with no explanation.
- After changing production variables, redeploy both projects — `NEXT_PUBLIC_API_URL` is
  inlined at build — and expect everyone to sign in once more, since the old cookie was
  scoped to the Vercel API host.

## Rotating the shared secrets

These work only when **both** sides change. Rotate on a schedule and when someone with
access leaves; use a unique random value per environment (`openssl rand -base64 32`), never
the `.env.example` placeholder.

| Secret | Held by | Order |
| --- | --- | --- |
| `REVALIDATE_SECRET` | `scriptr-api`, `scriptr-web` | Both projects, redeploy both, then remove the old value. A mismatch is `401` on `/api/revalidate`. |
| `OPTIMIZER_SECRET` | `scriptr-api`, Cloud Run (`optimizer-secret`) | New Secret Manager version, deploy the service, then set the API and redeploy. Uploads answer `503` between the two. |
| `SITEMAP_SECRET` | `scriptr-api`, `scriptr-web` | As `REVALIDATE_SECRET`. A mismatch silently drops script URLs from `/sitemap.xml`. |
| `ADMIN_TOTP_SECRET` | `scriptr-api` only | Generate, set, re-enrol the `otpauth` URI. Every issued token dies with the restart. |
| `SANITY_REVALIDATE_SECRET` | `scriptr-web`, the Sanity webhook | Set and redeploy the web project, then update the webhook header. Publishes `401` in between. |

**A Cloud Run version is not `latest` by being enabled:** `latest` is the highest version
*number*, whatever its state, so disabling a bad version makes the next mount fail with
`FAILED_PRECONDITION`. Recover with a new version holding the good value:

```bash
gcloud secrets versions access <good-version> --secret=<name> \
  | gcloud secrets versions add <name> --data-file=-
```

Never run that `add` with an unset variable — `<<< "$NEW_KEY"` sends a bare newline, which
Cloud Run mounts as an empty secret. Check `printf '%s' "$NEW_KEY" | wc -c` first, and
remember the running revision keeps its values until the next deploy.

Two rules make rotation uneventful: deploy the consumer first when it only verifies
(`scriptr-web` for revalidation, the optimizer for signing), and read the startup report
after deploying — every app prints which variables are set, names only.

## Verification

```bash
curl -i https://api.scriptr.uk/api                    # JSON, 200
curl -i https://api.scriptr.uk/api/auth/session       # JSON, 200
curl -i -H 'Origin: https://scriptr.uk' https://api.scriptr.uk/api/auth/session
curl -i https://scriptr.uk/
# 401 — unsigned publish rejected (503 = SANITY_REVALIDATE_SECRET missing)
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://scriptr.uk/api/sanity/revalidate
# 401 — the route exists and wants a token
curl -s -o /dev/null -w '%{http_code}\n' https://api.scriptr.uk/api/sanity/universities
# 403 — the sitemap secret is enforced
curl -s -o /dev/null -w '%{http_code}\n' https://api.scriptr.uk/api/sitemap/scripts
```

The CORS response must carry `Access-Control-Allow-Origin: https://scriptr.uk` and
`Access-Control-Allow-Credentials: true`. Signed in as an admin, `/admin` shows the code
form, and after entering a code the flag queue loads and the Studio's "Sync with Database"
works on the same code.

Before a deployment-related commit:

```bash
corepack pnpm --filter @scriptr/api check-types
corepack pnpm --filter scriptr-next check-types
corepack pnpm --filter scriptr-sanity check-types
corepack pnpm --filter scriptr-next build
```
