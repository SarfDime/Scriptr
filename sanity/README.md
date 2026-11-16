# Scriptr Studio

Sanity Studio for the academic catalog (University → Faculty → Study → Subject, plus
Professors) and the site's pages, navigation and sections. Academic documents link to
Postgres rows through `dbId` (`docs/ARCHITECTURE-ACADEMIC-CATALOG.md`). Rules for
changing it: [`AGENTS.md`](AGENTS.md).

```bash
corepack pnpm install      # from the repo root
corepack pnpm dev:sanity
```

## Environment

`sanity/.env`, from `.env.example`:

```env
SANITY_STUDIO_PREVIEW_ORIGIN=http://localhost:3000
SANITY_STUDIO_API_URL=http://localhost:8787
```

No API secret goes here: Vite inlines every `SANITY_STUDIO_*` value into the public
bundle. `sanity build`/`deploy` load `sanity/.env.production` on top of `.env`, which is
where the real API URL belongs while `dev` keeps localhost. The API adds only the
localhost dev ports to CORS automatically, so a deployed Studio must be listed in the
API's `CORS_ORIGINS`.

Sync and delete actions need an access code. Generate the secret with
`corepack pnpm --filter @scriptr/api admin:totp`, enrol it in an authenticator app, and
the Studio asks for the current code before the first action and again when the
twenty-minute token lapses. `401 Access expired` means the token lapsed;
`503 Admin access is not configured` means `ADMIN_TOTP_SECRET` is missing on the API.

## Commands

```bash
corepack pnpm dev:sanity
corepack pnpm build:sanity
corepack pnpm check-types:sanity
corepack pnpm sanity:typegen     # schema.json + types
corepack pnpm sanity:schema      # schema.json only
corepack pnpm sanity:types       # types only
```

TypeGen writes `shared/types/sanity.types.ts` from the queries in
`next/sanity/queries/`. Run it after any schema change, then `check-types`. Never
hand-edit `sanity/schema.json` or `shared/types/sanity.types.ts`.

## Academic entity actions

`actions/academicEntitySync.tsx`, against the Hono `/api/sanity/*` routes:

- **Create in Database** creates the Postgres row and writes its id back as `dbId`.
- **Sync with Database** pushes later edits.
- Publishing is blocked until the document has a `dbId`.
- Deleting is blocked by the API's dependency check (`409`) while content still points
  at the row (scripts, comments, a user's subject statuses). The row's own assignment
  rows — `subject_professors`, `professor_faculties`, `professor_studies` — go with it,
  since nothing in the app can unassign them.
- Every call carries the twenty-minute token from `lib/api-access.ts`.

## Publish webhook

Configure per dataset in **Manage → API → Webhooks**:

- **URL**: `https://<web app>/api/sanity/revalidate`, **Method**: `POST`
- **Trigger**: create, update and delete
- **Filter**: `!(_id in path("drafts.**"))` — a draft is not what readers see
- **Headers**: `x-sanity-webhook-secret` = `SANITY_REVALIDATE_SECRET` from the web app
- **Projection**: `{"_id": _id, "_type": _type}` — the route reads nothing else

The route maps `_type` to a cache tag (`SANITY_TYPE_TAGS`,
`shared/config/cache-tags.ts`), so a subject publish invalidates subject reads only. A
new document type needs an entry there; unmapped types are ignored and logged. Object
types (portable text, localized primitives) ride along with their owning document.

## Layout

`schemas/` (documents and objects: `academic/`, `navigation/`, `pages/`, `section/`,
`common/`, `misc/`), `actions/`, `structure-tool/`, `migrations/` (content migrations;
the academics seed patches by subject `code` and mirrors the patch onto a matching draft,
or publishing a stale draft would revert it), `styles/`.

The production Studio is https://scriptr.sanity.studio; the deploy flow is in the root
`README.md`.
