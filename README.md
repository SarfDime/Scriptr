# Scriptr

Scriptr is a script-sharing platform for university courses. The repository currently contains a Hono REST API and a Next.js frontend template.

## Repository Layout

- `hono/` - implemented Hono API
- `next/` - Next.js frontend template and shared UI starting point
- `supabase/` - local Supabase configuration, when present

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

Keep secrets out of source control. The `next/` template uses its own environment file for frontend configuration.

## Commands

```bash
npm run dev          # Start the API and frontend development processes
npm run dev:api      # Start the Hono API
npm run dev:next     # Start the Next.js template
npm run check-types  # Type-check both workspaces
npm run lint         # Run Biome checks
npm run format       # Format the repository with Biome
```

## API

The API is mounted under `/api`. See [hono/README.md](hono/README.md) for setup and [hono/src/routes/API_DOCUMENTATION.md](hono/src/routes/API_DOCUMENTATION.md) for the endpoint reference.

## Frontend

`next/` is currently a template. It is not presented as a complete product frontend yet, but provides the Next.js structure and reusable UI components for future integration with the API.
