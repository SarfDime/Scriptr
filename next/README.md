# Next.js Frontend

This directory contains the Next.js frontend, reusable components, styling, and API test pages for Scriptr. The Hono service in `../hono` is the application backend.

## Development

From the repository root:

```bash
npm install
npm run dev:next
```

The app runs with Next.js and connects to the API at `http://localhost:8787` during local development.

## Environment

Configure the frontend in `next/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8787
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=your_dataset
NEXT_PUBLIC_ENVIRONMENT_TYPE=development
SANITY_AUTH_TOKEN=your_token
```

Do not expose private tokens through variables prefixed with `NEXT_PUBLIC_`.

## Commands

```bash
npm run dev:next
npm run check-types --workspace next
npm run build:next
```

## Status

The frontend includes simple API test pages at `/api-test` and `/auth` for exercising the Hono service. New screens should use the existing components, styles, and API client while the backend contract is documented in [the Hono API reference](../hono/src/routes/API_DOCUMENTATION.md).
