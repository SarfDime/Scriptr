# Scriptr Studio

Sanity Studio for Scriptr's editorial content: the academic catalog
(University → Faculty → Study → Subject, plus Professors) and the site's pages,
navigation, and sections. Academic documents are linked to Postgres rows through
a `dbId`; see `docs/ARCHITECTURE.md` §2 for the sync model.

## Setup

From the repository root:

```bash
corepack pnpm install
corepack pnpm dev:sanity
```

Copy `sanity/.env.example` to `sanity/.env`:

```env
SANITY_STUDIO_PREVIEW_ORIGIN=http://localhost:3000
SANITY_STUDIO_API_URL=http://localhost:8787
```

No API secret goes here: Vite inlines every `SANITY_STUDIO_*` value into the
deployed bundle, which is served to anyone who loads the Studio.

- `SANITY_STUDIO_API_URL` must point at the real Hono API in any non-local
  environment.
- Sync/delete actions need an access code: the API prints a TOTP secret with
  `corepack pnpm --filter @scriptr/api admin:totp`, you enrol it in an
  authenticator app, and the Studio asks for the current code the first time an
  action runs and again whenever the ten-minute token lapses. A `401 Access
  expired` means the token lapsed; `503 Admin access is not configured` means
  `ADMIN_TOTP_SECRET` is missing on the API.
- Production values belong in `sanity/.env.production`, not `sanity/.env`:
  `sanity build`/`sanity deploy` load it in Vite production mode on top of
  `.env`, so the deployed bundle gets the real API URL while `sanity dev` keeps
  pointing at localhost.
- CORS is not open for the hosted Studio by default: the API only adds the
  localhost dev ports automatically, and only outside production. A deployed
  Studio must be listed in the API's `CORS_ORIGINS`.

## Commands

Run from the repository root:

```bash
corepack pnpm dev:sanity        # Start the Studio
corepack pnpm build:sanity      # Build the Studio
corepack pnpm check-types:sanity # Type-check this workspace
corepack pnpm sanity:typegen    # Extract schema.json and generate types
corepack pnpm sanity:schema     # Extract schema.json only
corepack pnpm sanity:types      # Generate TypeScript types only
```

TypeGen writes to `shared/types/sanity.types.ts` from the queries under
`next/sanity/queries/`. Run `corepack pnpm sanity:typegen` after any schema change,
then `corepack pnpm check-types`. Never hand-edit `sanity/schema.json` or
`shared/types/sanity.types.ts`.

## Academic entity actions

Academic documents (`university`, `faculty`, `study`, `subject`, `professor`)
share one pattern, implemented in `actions/academicEntitySync.tsx` against the
Hono `/api/sanity/*` routes:

- **Create in Database** creates the Postgres row and writes its id back as
  `dbId`.
- Every one of these calls carries the ten-minute access token from
  `lib/api-access.ts`; the first action in a window asks for the authenticator
  code before it runs.
- **Sync with Database** pushes later edits.
- Publishing is blocked until a document has a `dbId`.
- Deleting is blocked by the API's dependency check (`409`).

A new academic entity type should extend `getDatabaseAcademicEndpoints`
(`shared/utils/api.utils.ts`) and `parentFieldFor`/`parentColumnFor`
exhaustively, with no silent default.

## Layout

- `schemas/`: document and object schemas (`academic/`, `navigation/`, `pages/`,
  `section/`, `common/`, `misc/`).
- `actions/`: custom document actions, including the database sync.
- `structure-tool/`: Studio structure (desk) configuration.
- `migrations/`: content migrations, including the academics seed.
- `styles/`: Studio styling.

The production Studio is deployed at https://scriptr.sanity.studio; the deploy
flow is described in the root `README.md`.
