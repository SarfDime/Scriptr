# Scriptr

University script-sharing platform, in one pnpm workspace.

| Directory    | Responsibility                          |
| ------------ | --------------------------------------- |
| `hono/`      | API, Supabase, auth, R2 file operations |
| `next/`      | Frontend                                |
| `sanity/`    | Studio and schema tooling               |
| `shared/`    | Types, config, strings, utils           |
| `optimizer/` | File optimizer service                  |

Requirements: Node 24+, Corepack with the pinned pnpm, and credentials for Supabase,
Cloudflare R2 and Sanity.

## Install

```bash
corepack pnpm install
```

The root lockfile covers every workspace; pnpm's isolated linker keeps each one to its
declared dependencies. `shared/` stays importable through the `@shared/*` aliases.

## Environment

Each workspace has an `.env.example`:

| Workspace | Copy to       | Covers                                                               |
| --------- | ------------- | -------------------------------------------------------------------- |
| `hono/`   | `hono/.env`   | Supabase, R2, sitemap secret, Studio TOTP secret, cache revalidation |
| `next/`   | `next/.env`   | API URL, Sanity project, revalidation and webhook secrets            |
| `sanity/` | `sanity/.env` | Studio API URL, preview origin                                       |

Values that must match across workspaces:

- `SITEMAP_SECRET` in `hono/` and `next/`, or the sitemap drops every script URL.
- `ADMIN_TOTP_SECRET` in `hono/` and the code in your authenticator app; the Studio asks
  for it once per twenty minutes. Nothing secret lives in `sanity/`.
- `REVALIDATE_SECRET` in `hono/` and `next/`, or cache revalidation is rejected.
- `SANITY_REVALIDATE_SECRET` in `next/` and the Sanity publish webhook's
  `x-sanity-webhook-secret` header, or a publish only reaches readers on the next deploy.

Secrets never enter source control. Every app prints an env checklist on start (names
and consequences only), so a fresh checkout lists what is missing.

## Commands

```bash
corepack pnpm dev                # next + hono + sanity + optimizer
corepack pnpm dev:{hono|next|sanity|optimizer}
corepack pnpm build:next         # also: start:next, build:sanity
corepack pnpm gen:api-types      # Supabase types (Postgres changed)
corepack pnpm sanity:typegen     # schema.json + Sanity types (schema changed)
corepack pnpm gen:api-endpoints  # shared/config/api-routes.ts (route mounted)
corepack pnpm db:migrate         # pending migrations, dry run without --apply
corepack pnpm check-types        # all workspaces (check-types:sanity for the Studio)
corepack pnpm test               # api + optimizer + shared
corepack pnpm format             # Biome write (it is the linter)
corepack pnpm format:unsafe      # also unsafe fixes — review the diff
```

## Brand

The mark is two interlocked hexagons whose halves form an S: `shared/brand/mark.svg`,
plus `mark-bold.svg` for the wordmark and every icon. Path data, literal colours and the
default social card are in `shared/config/brand.ts`; a test keeps them equal to the SVGs
and to `next/styles/base/colors*.module.css`. `next/app/icon.svg`, `favicon.ico`,
`apple-icon.png`, `next/app/manifest.ts` and `next/public/icons/` are the app's icon set,
`sanity/static/` is the Studio's.

## Deployment

- `*-s-*` branches run the Sanity workflow: lint, Sanity type-check, Studio build and a
  GraphQL schema dry-run. No production deploy.
- Pushes to `staging` run that dry-run only when the commit message contains `-s-`.
- Vercel builds `main`, `staging`, `feat-*`, `feat/**`, `fix-*`, `fix/**` — and only for
  commit subjects starting with `feat:` or `fix:`. Detail:
  [Vercel deployment](docs/VERCEL_DEPLOYMENT.md).
- The production Sanity workflow deploys the Studio and GraphQL schema from
  `main-sanity`, and only when the pushed commit message contains `-s-`. The manual
  force-deploy workflow is restricted to `main-sanity`, needs no `-s-`, and is for an
  intentional breaking schema change: it redeploys the Studio and deploys the schema
  without breaking-change protection. It does not bypass lint, type-check or build.

```bash
git push origin staging:main          # website (Vercel skips a subject without feat:/fix:)
git push origin staging:main-sanity   # Studio + schema; include -s- in the commit message
```

The Studio lives at https://scriptr.sanity.studio.

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — index of the per-area files
- [Progress](docs/PROGRESS.md) — outstanding work
- [API setup](hono/README.md), [API reference](hono/src/routes/API_DOCUMENTATION.md),
  [API testing](hono/src/routes/API_TESTING_GUIDE.md)
- [Frontend setup](next/README.md), [styling guide](next/STYLING_GUIDE.md)
- [Studio setup](sanity/README.md)
- [Deployment](docs/VERCEL_DEPLOYMENT.md)
- [Agent rules](AGENTS.md)

## Use and contributions

© 2026 Sarf Dime. All rights reserved.

This repository is published for transparency only. No license is granted: you may not
copy, modify, distribute or reuse the code, and external contributions are not accepted.
Report a security issue privately as described in [SECURITY.md](SECURITY.md).
