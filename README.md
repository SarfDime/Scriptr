# Scriptr

Scriptr is a university script-sharing platform. The repository is a single pnpm
workspace containing a Hono API, a Next.js frontend, and a Sanity Studio.

## Packages

| Directory | Responsibility                                        |
| --------- | ----------------------------------------------------- |
| `hono/`   | API, Supabase, authentication, and R2 file operations |
| `next/`   | Frontend and shared UI components                     |
| `sanity/` | Sanity Studio and schema tooling                      |
| `shared/` | Shared types, configuration, strings, and utilities   |
| `optimizer/` | File optimizer service (see its README)             |

## Requirements

- Node.js 24+ (LTS)
- Corepack with pnpm 12 (pinned in `package.json`)
- Supabase credentials for the API
- Cloudflare R2 credentials for uploads
- Sanity project credentials for the Studio and frontend

## Install

```bash
corepack pnpm install
```

The root `pnpm-lock.yaml` covers the workspaces. pnpm's isolated linker keeps
each workspace limited to its declared dependencies. `shared/` is a lightweight
workspace package; its TypeScript source remains available through the existing
`@shared/*` path aliases.

## Environment

Each workspace has an `.env.example`. Copy it and fill in the values:

| Workspace | Example file          | Copy to           | Covers                                            |
| --------- | --------------------- | ----------------- | ------------------------------------------------- |
| `hono/`   | `hono/.env.example`   | `hono/.env`       | Supabase, R2, internal secret, cache revalidation |
| `next/`   | `next/.env.example`   | `next/.env.local` | API URL, Sanity project, revalidation secret      |
| `sanity/` | `sanity/.env.example` | `sanity/.env`     | Studio API URL, internal secret, preview origin   |

Some values must match across workspaces:

- `INTERNAL_API_SECRET` (`hono/`) and `SANITY_STUDIO_INTERNAL_SECRET` (`sanity/`),
  or every Studio sync/delete action fails.
- `REVALIDATE_SECRET` in `hono/` and `next/`, or cache revalidation is rejected.

Keep secrets out of source control.

## Commands

```bash
corepack pnpm dev                # Start Next.js, the Hono API, Sanity Studio and the optimizer together
corepack pnpm dev:hono           # Start the Hono API
corepack pnpm dev:next           # Start the Next.js frontend
corepack pnpm dev:sanity         # Start Sanity Studio
corepack pnpm dev:optimizer      # Start the file optimizer (needs Ghostscript)
corepack pnpm build:next         # Build the frontend
corepack pnpm start:next         # Serve the built frontend
corepack pnpm build:sanity       # Build Sanity Studio
corepack pnpm gen:api-types      # Generate Supabase API types
corepack pnpm db:migrate         # Apply pending Supabase migrations safely (dry run without --apply)
corepack pnpm gen:api-endpoints  # Regenerate shared/config/api-routes.ts from the live route tree
corepack pnpm check-types        # Type-check all workspaces
corepack pnpm check-types:sanity # Type-check Sanity only
corepack pnpm test              # Run the API's unit tests (node:test)
corepack pnpm format             # Apply Biome formatting and safe fixes (replaces a separate lint step)
corepack pnpm format:unsafe      # Also apply unsafe fixes (can delete "unused" effect dependencies; review the diff)
corepack pnpm sanity:typegen     # Extract the Sanity schema and generate types
corepack pnpm sanity:schema      # Extract schema.json only
corepack pnpm sanity:types       # Generate TypeScript types only
```

## Deployment and branch behavior

- Branches matching `*-s-*` run the Sanity validation workflow: lint, Sanity
  type-check, Studio build, and a GraphQL schema dry-run. These branches do
  not deploy the production Studio or schema.
- Pushes to `staging` run the same dry-run only when the commit message
  contains `-s-`.
- Vercel Git deployments are enabled for `main`, `staging`, and branches
  matching `feat-*`, `feat/**`, `fix-*`, or `fix/**`. The Ignored Build Step
  also requires commit subjects starting with `feat:` or `fix:`. See
  [Vercel deployment](docs/VERCEL_DEPLOYMENT.md) for details.
- The production Sanity workflow deploys the Studio and GraphQL schema from
  `main-sanity` only when the pushed commit message contains `-s-`. The manual
  force-deploy workflow is restricted to `main-sanity` but does not require
  `-s-` in the commit message.

### Production deploy commands

Deploy the production website:

```bash
git push origin staging:main
```

Vercel may skip the build if the pushed commit subject does not start with
`feat:` or `fix:`.

Deploy the Sanity production studio and schema:

```bash
git push origin staging:main-sanity
```

Ensure the pushed commit message contains `-s-` to trigger the regular Sanity
deploy workflow. The manual force-deploy workflow is independent of that marker.

Use the manual force-deploy workflow on `main-sanity` only when an intentional
breaking GraphQL schema change is blocked. It redeploys the Studio and deploys
the schema with breaking-change protection disabled; it does not bypass lint,
type-check, or build failures.

The Studio is deployed at https://scriptr.sanity.studio.

## Documentation

- [Architecture & requirements](docs/ARCHITECTURE.md) — overview + links to the per-area files in `docs/`
- [Progress & todos](docs/PROGRESS.md)
- [Vercel deployment](docs/VERCEL_DEPLOYMENT.md)
- [API setup](hono/README.md)
- [API reference](hono/src/routes/API_DOCUMENTATION.md)
- [API testing guide](hono/src/routes/API_TESTING_GUIDE.md)
- [Frontend setup](next/README.md)
- [Frontend styling guide](next/STYLING_GUIDE.md)
- [Studio setup](sanity/README.md)
- [Agent guide](AGENTS.md) — global rules, plus an index of the per-app agent guides in `docs/`
