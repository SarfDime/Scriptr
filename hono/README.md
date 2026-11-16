# Scriptr API

Hono on Node: auth, profiles, academic catalog, scripts, comments, flags, votes,
ratings, favorites, profile selections, notifications, achievements, restrictions and
R2 file operations. Supabase (Auth + Postgres) and Cloudflare R2 via the S3 SDK.

Rules for changing it: [`AGENTS.md`](AGENTS.md). Endpoint detail:
[`src/routes/API_DOCUMENTATION.md`](src/routes/API_DOCUMENTATION.md); curl walkthrough:
[`src/routes/API_TESTING_GUIDE.md`](src/routes/API_TESTING_GUIDE.md).

## Setup

```bash
corepack pnpm install     # from the repo root
corepack pnpm dev:hono    # port 8787, or PORT
```

Create `hono/.env` from `.env.example`. The values that are easy to get wrong:

- `SITEMAP_SECRET` scopes `GET /api/sitemap/scripts` and must match `next/`'s.
- `ADMIN_TOTP_SECRET` gates the Studio's sync/delete actions. Generate it with
  `corepack pnpm --filter @scriptr/api admin:totp`, add the printed `otpauth` URI to an
  authenticator app, paste the secret into `hono/.env`. The Studio asks for a code once
  per twenty minutes and bundles nothing secret.
- `CORS_ORIGINS` is the allowlist. The localhost dev ports (3000, 5173, 3333) are added
  unless `NODE_ENV=production`; everything else, the hosted Studio included, must be
  listed. An unlisted Studio origin fails its preflight
  (`Reason: CORS request did not succeed`); a `401 Access code required` after that means
  no code was entered yet or the token lapsed.
- `R2_ENDPOINT` is the bucket's S3 endpoint with no path on the end — a path stores every
  object under an extra prefix and breaks public avatar URLs.
- `R2_PUBLIC_URL` is the bucket's public domain. Avatars live at
  `avatars/{userId}.webp` in `R2_BUCKET`; without it, avatar uploads answer `503`. It is
  the only public object in the bucket: keep `r2.dev` access off and put a WAF rule on
  the custom domain that allows only `/avatars/*`, so script files stay behind expiring
  signed URLs.
- A university can override the bucket through `universities.r2_bucket_id`; `R2_BUCKET`
  is the fallback ([File Uploads](src/routes/API_DOCUMENTATION.md#uploads)).
- `OPTIMIZER_URL` and `OPTIMIZER_SECRET` are optional but go together. With neither,
  `/file-ops/finalize` validates files in-process without shrinking them; with one, or
  an unreachable service, finalize answers `503` instead of storing a file unoptimized.
- `NEXT_REVALIDATE_URL` and `REVALIDATE_SECRET` are the cache-revalidation webhook called
  after mutations; the secret must match `next/`'s. In production the URL is the web
  project's Vercel alias, not the public hostname — Cloudflare drops the API's
  server-to-server request ([`VERCEL_DEPLOYMENT.md`](../docs/VERCEL_DEPLOYMENT.md)).

## Commands

```bash
corepack pnpm dev:hono
corepack pnpm --filter @scriptr/api check-types
corepack pnpm test
corepack pnpm gen:api-types       # after a Postgres change
corepack pnpm gen:api-endpoints   # after mounting or renaming a route
```

## Migrations

`supabase/migrations` mirrors the remote history one-to-one; `supabase migration list
--linked` must show no local/remote mismatch. Change the schema only by adding a
migration file and applying it — never through the dashboard SQL editor, which records a
migration with no file and makes `db push` refuse to run. If that happens,
`supabase migration fetch --linked` writes the missing files but overwrites existing
ones: `git checkout` those and keep only the new file.

`corepack pnpm db:migrate` wraps the push. It is a dry run unless you pass `--apply`:

```bash
corepack pnpm db:migrate            # analyse and preview
corepack pnpm db:migrate --apply    # push, then regenerate types
corepack pnpm db:migrate --apply --skip-types
```

It refuses to touch the database when the project is unlinked, when the remote has a
migration with no local file, when a pending migration is uncommitted
(`--allow-uncommitted`), or when a pending file is destructive — `DROP
TABLE`/`COLUMN`/`SCHEMA`, `TRUNCATE`, `ALTER COLUMN … TYPE`, a `DELETE` with no `WHERE`
(`--allow-destructive`). After a successful push it regenerates
`shared/types/database.types.ts`, confirms nothing is pending, reminds you to run
`check-types`, and revalidates the cached public profiles (a migration can change data
they embed). That last step is skipped without `NEXT_REVALIDATE_URL` and
`REVALIDATE_SECRET`.

## Base path

The app is built with `.basePath('/api')`, so every route — the health check at
`GET /api/` included — is mounted below `/api`, including `/api/sanity/*` and
`/api/admin/*`.

## Security model in one screen

- RLS is the boundary; the route decides which client to use. Details and per-table
  grants: [`API_DOCUMENTATION.md`](src/routes/API_DOCUMENTATION.md).
- `/api/sanity/*` needs a twenty-minute admin token in `x-admin-token`, traded for a TOTP
  code at `POST /api/sanity/access`; reads included. RLS closes those tables to every
  Supabase role, admin included — there is no session path.
- `/api/admin/*` needs the same unlock plus an admin session, and is pinned to
  `WEBSITE_ORIGIN`. `/api/sanity/*` is pinned to `SANITY_STUDIO_ORIGIN`. A request from
  one surface's origin gets `403` on the other.
- Restriction checks block create and update, never delete.
- `GET /api/sitemap/scripts` is the only shared-header-secret route
  (`x-sitemap-secret`), 10 requests a day and 2 a minute per IP.
- `GET /api/file-ops/get-file/*` is unauthenticated by design and signs only keys found in
  `script_files`, deriving the bucket from that row.
- Rating types are the one publicly readable lookup table; only their mutation is
  admin-gated. Moderators have no elevated access anywhere yet.
