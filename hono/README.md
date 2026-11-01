# Scriptr API

The Hono service is Scriptr's backend. It provides authentication, profiles,
academic catalog data, scripts, comments, flags, votes, ratings, favorites,
profile selections (faculties/studies/subjects), notifications (including
onboarding, account-creation, and achievement notifications), achievement
award-checking, user restrictions, and Cloudflare R2 file operations.

## Stack

- Hono on Node.js
- Supabase Auth and PostgreSQL
- Cloudflare R2 for file storage
- AWS S3 SDK for R2 access

## Setup

From the repository root:

```bash
corepack pnpm install
corepack pnpm dev:hono
```

The API starts on port `8787` by default. Set `PORT` to override it.

Create `hono/.env` locally. Use deployment secrets in production:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SECRET_KEY=your_supabase_secret_key
INTERNAL_API_SECRET=development_secret_key
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET=your_bucket_name
R2_PUBLIC_URL=your_public_r2_domain
NODE_ENV=development
PORT=8787
NEXT_REVALIDATE_URL=http://localhost:3000/api/revalidate
REVALIDATE_SECRET=development_secret_key
```

Universities can override `R2_BUCKET` per-university via
`universities.r2_bucket_id` — see [File Uploads](src/routes/API_DOCUMENTATION.md#file-uploads).
`R2_BUCKET` remains the fallback for any university without one set.

`INTERNAL_API_SECRET` must match `SANITY_STUDIO_INTERNAL_SECRET` in the Sanity
Studio environment, or every Studio sync/delete action fails.

`R2_ENDPOINT` must be the bucket's S3 endpoint and nothing more — a path on the
end (e.g. `.../scriptr`) makes the SDK store every object under an extra prefix,
which shows up as broken public avatar URLs.

`R2_PUBLIC_URL` is the bucket's public domain (a custom domain, or its `r2.dev`
URL). Avatars are written to `R2_BUCKET` at `avatars/{userId}.webp` and served
from there, so avatar uploads (`POST /profiles/me/avatar*`) answer `503`
without it. This is the one thing in the bucket that is publicly readable:
keep `r2.dev` access off and front the custom domain with a WAF rule that
blocks every path outside `/avatars/*`, so script files stay private (they are
still served through expiring signed URLs from `GET /file-ops/get-file/*`).

`OPTIMIZER_URL` and `OPTIMIZER_SECRET` are optional and must be set together.
They point the API at the file optimizer service; with neither set,
`/file-ops/finalize` uses an in-process stand-in that validates files but
doesn't shrink them. If only one is set, or the service is unreachable,
finalize fails with `503` instead of storing a file unoptimized.

`NEXT_REVALIDATE_URL` and `REVALIDATE_SECRET` configure the cache-revalidation
webhook the API calls after mutations; `REVALIDATE_SECRET` must match the
value in the frontend's environment (`next/.env.example`). In production the
URL must be the web project's Vercel alias
(`https://scriptr-web-team-slug.vercel.app/api/revalidate`), because the
public hostname is behind Cloudflare and the proxy drops the API's server-to-
server request. See [`VERCEL_DEPLOYMENT.md`](../VERCEL_DEPLOYMENT.md).

Never commit `.env` files or storage credentials.

## Commands

```bash
corepack pnpm dev:hono
corepack pnpm --filter @scriptr/api check-types
corepack pnpm test
corepack pnpm format
corepack pnpm gen:api-types
corepack pnpm gen:api-endpoints
```

Formatting is run from the repository root and applies Biome fixes
automatically. `gen:api-types` regenerates the Supabase types after a schema
change; `gen:api-endpoints` (run from the repository root) regenerates
`shared/config/api-routes.ts` after any route is added, removed, or renamed.

## Database Migrations

`hono/supabase/migrations` mirrors the remote migration history one-to-one;
`supabase migration list --linked` should show no local/remote mismatch. Make
schema changes only by adding a migration file here and applying it with
`supabase db push --linked` (preview with `--dry-run`), then run
`corepack pnpm gen:api-types`. Do not apply schema changes through the Supabase
dashboard SQL editor: it records a migration with no file, and `db push` then
refuses to run. If that happens, `supabase migration fetch --linked` writes the
missing files (it overwrites existing files with the recorded SQL, so restore
those with `git checkout` and keep only the new ones).

## API Base Path

The app is built with `.basePath('/api')`, so **every** route — including
the root health check (`GET /api/`) — is mounted below `/api`:

- `/api/` (health check)
- `/api/auth`
- `/api/file-ops`
- `/api/scripts`
- `/api/votes`
- `/api/comments`
- `/api/flags`
- `/api/favorites`
- `/api/profiles`
- `/api/profile-subjects`
- `/api/profile-faculties`
- `/api/profile-studies`
- `/api/universities`
- `/api/faculties`
- `/api/studies`
- `/api/professors`
- `/api/subjects`
- `/api/ratings`
- `/api/notifications`
- `/api/restrictions`
- `/api/internal`

The complete endpoint, authentication, authorization, validation, and error
reference is in [API_DOCUMENTATION.md](src/routes/API_DOCUMENTATION.md). A
curl walkthrough covering every route is in
[API_TESTING_GUIDE.md](src/routes/API_TESTING_GUIDE.md).

## Security Notes

- Academic catalog routes (`/api/universities`, `/api/faculties`, `/api/studies`, `/api/professors`, `/api/subjects`) are **not** public — every request, reads included, requires the `x-internal-secret` header matching `INTERNAL_API_SECRET`. RLS closes these tables to every Supabase role, admin included; there is no session-based access path at all.
- Catalog writes and role changes are exposed on `/api/internal` and require `x-internal-secret`; `/api/universities` is read-only.
- Authentication uses the Supabase session cookie only (no Bearer-token path). `POST /api/auth/callback` establishes the session from the tokens in an email-confirmation link.
- Rating types (`/api/ratings/types`) are the one lookup table that's actually public to read; only mutation is admin-gated, via `is_admin()` RLS on the admin's own session — no internal secret involved there.
- User-specific write routes require a valid Supabase session cookie.
- Role updates are never exposed on the public profile routes.
- Moderators currently have zero elevated access anywhere in this API — the role exists in the schema but isn't checked by any policy or route yet.
- Restricted users (`profile_restrictions`, admin-managed via `/api/restrictions`) are blocked at the RLS layer from creating/updating scripts, comments, comment reactions/likes, flags, votes, and ratings — never from removing their own existing content. See [API_DOCUMENTATION.md](src/routes/API_DOCUMENTATION.md#role-based-access-control).
- Route parameters are validated before database operations.
- Uploads are restricted to the file types documented in the API reference, and scoped per-university to a distinct R2 bucket when `r2_bucket_id` is set.
- `GET /api/file-ops/get-file/*` is unauthenticated (guest preview/download) and only signs keys recorded in `script_files`, deriving the bucket from that row.
- R2 and Supabase credentials must be supplied through environment variables.

## Response Types

Route response shapes are defined in `shared/types/` and applied at the route
(for example `c.json<LoginResponse>(...)` using `shared/types/auth.types.ts`),
so `next/` and `sanity/` consume the same definitions the backend returns.
Anything a `hono/` route imports must live under `shared/`, never `next/types/`.
When adding or changing a route, add or update its response type there rather
than returning an untyped object.

## Route Files: Build It, Then Mount It

Every route file (`src/routes/*.ts`) needs an explicit
`app.route('/path', router)` call in `src/index.ts`. A route file that is
fully built and documented but never mounted type-checks clean, passes review,
and silently 404s in production (this already happened once with `ratings.ts`).
Before calling route work done, grep `src/index.ts` for the new route file,
run `corepack pnpm gen:api-endpoints`, and update `API_DOCUMENTATION.md`,
`API_TESTING_GUIDE.md`, and `PROGRESS.md`.