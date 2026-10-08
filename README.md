# Scriptr

Scriptr is a university script-sharing platform. The repository is a single npm
workspace containing a Hono API, a Next.js frontend, and a Sanity Studio.

## Packages

| Directory | Responsibility                                            |
| --------- | --------------------------------------------------------- |
| `hono/`   | API, Supabase, authentication, and R2 file operations     |
| `next/`   | Frontend and shared UI components                         |
| `sanity/` | Sanity Studio and schema tooling                          |
| `shared/` | Shared types, configuration, strings, and utilities       |

## Requirements

- Node.js 24+ (LTS)
- npm
- Supabase credentials for the API
- Cloudflare R2 credentials for uploads
- Sanity project credentials for the Studio and frontend

## Install

```bash
npm install
```

## Environment

Each workspace has an `.env.example`. Copy it and fill in the values:

| Workspace | Example file          | Copy to           | Covers                                                    |
| --------- | --------------------- | ----------------- | --------------------------------------------------------- |
| `hono/`   | `hono/.env.example`   | `hono/.env`       | Supabase, R2, internal secret, cache revalidation         |
| `next/`   | `next/.env.example`   | `next/.env.local` | API URL, Sanity project, revalidation secret              |
| `sanity/` | `sanity/.env.example` | `sanity/.env`     | Studio API URL, internal secret, preview origin           |

Some values must match across workspaces:

- `INTERNAL_API_SECRET` (`hono/`) and `SANITY_STUDIO_INTERNAL_SECRET` (`sanity/`),
  or every Studio sync/delete action fails.
- `REVALIDATE_SECRET` in `hono/` and `next/`, or cache revalidation is rejected.

Keep secrets out of source control.

## Commands

```bash
npm run dev                # Start Next.js, the Hono API, and Sanity Studio together
npm run dev:hono           # Start the Hono API
npm run dev:next           # Start the Next.js frontend
npm run dev:sanity         # Start Sanity Studio
npm run build:next         # Build the frontend
npm run start:next         # Serve the built frontend
npm run build:sanity       # Build Sanity Studio
npm run gen:api-types      # Generate Supabase API types
npm run gen:api-endpoints  # Regenerate shared/config/api-routes.ts from the live route tree
npm run check-types        # Type-check all workspaces
npm run check-types:sanity # Type-check Sanity only
npm run format             # Apply Biome formatting and safe fixes (replaces a separate lint step)
npm run sanity:typegen     # Extract the Sanity schema and generate types
npm run sanity:schema      # Extract schema.json only
npm run sanity:types       # Generate TypeScript types only
```

## Deployment and branch behavior

The deploy flow is controlled by the branch name, which keeps schema-only
changes separate from full production deploys:

- Branch names containing `-s-` run the Sanity-only action path, the dry-run
  validation flow for schema and Studio changes.
- Branch names containing `-f-` run the full deploy path, including Sanity and
  any other release actions such as Vercel or app deploys.

### Production deploy commands

Deploy the production website:

```bash
git push origin staging:main
```

Deploy the Sanity production studio and schema:

```bash
git push origin staging:main-sanity
```

If a Sanity deploy fails for non-critical type changes or related schema drift,
use the force deploy action so the GraphQL/schema update can be pushed again.

The Studio is deployed at https://scriptr.sanity.studio.

## Documentation

- [Architecture & requirements](ARCHITECTURE.md)
- [Progress & todos](PROGRESS.md)
- [Ideas & open questions](TODO.md)
- [API setup](hono/README.md)
- [API reference](hono/src/routes/API_DOCUMENTATION.md)
- [API testing guide](hono/src/routes/API_TESTING_GUIDE.md)
- [Frontend setup](next/README.md)
- [Frontend styling guide](next/STYLING_GUIDE.md)
- [Studio setup](sanity/README.md)
- [Agent guide](AGENTS.md)
