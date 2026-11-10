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
  action runs and again whenever the twenty-minute token lapses. A `401 Access
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
- Every one of these calls carries the twenty-minute access token from
  `lib/api-access.ts`; the first action in a window asks for the authenticator
  code before it runs.
- **Sync with Database** pushes later edits.
- Publishing is blocked until a document has a `dbId`.
- Deleting is blocked by the API's dependency check (`409`) when content still
  points at the row (scripts, comments, a user's subject statuses). The row's own
  assignment rows — `subject_professors`, `professor_faculties`,
  `professor_studies` — are deleted with it rather than blocking, since nothing
  in the app can unassign them.

A new academic entity type should extend `getDatabaseAcademicEndpoints`
(`shared/utils/api.utils.ts`) and `parentFieldFor`/`parentColumnFor`
exhaustively, with no silent default.

## Publish webhook

A publish on any document type calls the web app's cache revalidation so the
edit reaches readers without a redeploy. Configure it per dataset in
**Manage → API → Webhooks**:

- **URL**: `https://<web app>/api/sanity/revalidate`
- **Method**: `POST`
- **Trigger on**: create, update and delete
- **Filter**: `!(_id in path("drafts.**"))` — a draft is not what readers see
- **HTTP headers**: `x-sanity-webhook-secret` set to `SANITY_REVALIDATE_SECRET`
  from the web app's environment
- **Projection**: `{"_id": _id, "_type": _type}` — the route reads nothing else

The route maps `_type` to a cache tag (`SANITY_TYPE_TAGS` in
`shared/config/cache-tags.ts`), so a subject publish invalidates subject reads
instead of the whole dataset. A new document type needs an entry there;
unmapped types are ignored and logged. Types that only exist as objects
(portable text, localized primitives) ride along with the document that owns
them.

## Layout

- `schemas/`: document and object schemas (`academic/`, `navigation/`, `pages/`,
  `section/`, `common/`, `misc/`).
- `actions/`: custom document actions, including the database sync.
- `structure-tool/`: Studio structure (desk) configuration.
- `migrations/`: content migrations, including the academics seed. It patches
  by subject `code` instead of replacing documents, and mirrors the patch onto
  a matching draft when one exists (a draft shadows its published document in
  the Studio, and publishing a stale draft would revert the seed).
- `styles/`: Studio styling.

The production Studio is deployed at https://scriptr.sanity.studio; the deploy
flow is described in the root `README.md`.
