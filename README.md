# Scriptr

Scriptr is a university script-sharing platform. The repository contains a
Hono API, a Next.js frontend, and a Sanity Studio in one npm workspace.

## Packages

| Directory | Responsibility                                        |
| --------- | ----------------------------------------------------- |
| `hono/`   | API, Supabase, authentication, and R2 file operations |
| `next/`   | Frontend, shared UI, and API test screens             |
| `sanity/` | Sanity Studio and schema tooling                      |
| `shared/` | Shared TypeScript configuration and types             |

## Requirements

- Node.js 20+
- npm
- Supabase credentials for the API
- Cloudflare R2 credentials for uploads
- Sanity project credentials for the Studio and frontend

## Install

```bash
npm install
```

## Environment

Copy the relevant `.env.example` files to `.env` or `.env.local`:

- `hono/.env.example` for Supabase, R2, and API settings.
- `next/.env.example` for the frontend API and Sanity settings.

Keep secrets out of source control.

## Commands

```bash
npm run dev          # Start the API and frontend development processes
npm run dev:hono     # Start the Hono API
npm run dev:next     # Start the Next.js frontend
npm run dev:sanity   # Start Sanity Studio
npm run build:sanity # Build Sanity Studio
npm run gen:api-types # Generate Supabase API types
npm run check-types  # Type-check all workspaces
npm run check-types:sanity # Type-check Sanity only
npm run format       # Apply Biome formatting and safe fixes
npm run sanity:typegen # Extract the Sanity schema and generate types
npm run sanity:schema  # Extract schema.json only
npm run sanity:types   # Generate TypeScript types only
```

## Documentation

- [API setup](hono/README.md)
- [API reference](hono/src/routes/API_DOCUMENTATION.md)
- [API testing guide](hono/src/routes/API_TESTING_GUIDE.md)
- [Frontend setup](next/README.md)
- [Frontend styling guide](next/STYLING_GUIDE.md)
- [Agent guide](AGENTS.md)

The frontend includes API test pages at `/api-test` and `/auth` for exercising
the Hono service.
