# Scriptr

Scriptr is a script-sharing platform for university courses. The repository contains a Hono REST API and a Next.js frontend.

## Repository Layout

- `hono/` - implemented Hono API
- `next/` - Next.js frontend and shared UI
- `hono/supabase/` - local Supabase configuration and seed data

## Requirements

- Node.js 20 or newer
- npm
- Supabase project credentials
- Cloudflare R2 credentials for file uploads

## Install

```bash
npm install
```

## Environment

Create `hono/.env` for local API development:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SECRET_KEY=your_supabase_secret_key
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET=your_bucket_name
R2_PUBLIC_URL=https://your-public-r2-domain
PORT=8787
```

Keep secrets out of source control. The `next/` app uses its own environment file for frontend configuration.

## Commands

```bash
npm run dev          # Start the API and frontend development processes
npm run dev:hono     # Start the Hono API
npm run dev:next     # Start the Next.js frontend
npm run dev:sanity   # Start Sanity Studio
npm run build:sanity # Build Sanity Studio
npm run gen:api-types # Generate Supabase API types
npm run check-types  # Type-check both workspaces
npm run check-types:sanity # Type-check Sanity only
npm run lint         # Run Biome checks
npm run format       # Format the repository with Biome
npm run sanity:typegen # Extract the Sanity schema and generate types
npm run sanity:schema  # Extract schema.json only
npm run sanity:types   # Generate TypeScript types only
```

## API

The API is mounted under `/api`. See [hono/README.md](hono/README.md) for setup and [hono/src/routes/API_DOCUMENTATION.md](hono/src/routes/API_DOCUMENTATION.md) for the endpoint reference.

## Frontend

The Next.js app includes simple API test pages at `/api-test` and `/auth` for exercising the Hono API.
