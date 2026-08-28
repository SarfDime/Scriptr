# Next.js Frontend Template

This directory is the current Next.js template for Scriptr. It contains the application shell, reusable components, styling, and API client setup for future frontend work. The Hono service in `../hono` is the implemented application backend.

## Development

From the repository root:

```bash
npm install
npm run dev:next
```

The template runs with Next.js and is intended to connect to the API at `http://localhost:8787` during local development.

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
npm run dev:app
npm run check-types --workspace next
npm run build --workspace next
```

## Status

The frontend is a template rather than a finished product interface. New screens should use the existing components, styles, and API client while the backend contract is documented in [the Hono API reference](../hono/src/routes/API_DOCUMENTATION.md).
