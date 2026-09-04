# Scriptr API

The Hono service is the implemented backend for Scriptr. It provides authentication, profiles, professors, subjects, scripts, comments, flags, votes, and Cloudflare R2 file operations.

## Stack

- Hono on Node.js
- Supabase Auth and PostgreSQL
- Cloudflare R2 for file storage
- AWS S3 SDK for R2 access

## Setup

From the repository root:

```bash
npm install
npm run dev:hono
```

The API starts on port `8787` by default. Set `PORT` to override it.

Create `hono/.env` locally. Use deployment secrets in production:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SECRET_KEY=your_supabase_secret_key
INTERNAL_API_SECRET=development_secret_key
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET=your_bucket_name
R2_PUBLIC_URL=your_public_r2_domain
PORT=8787
```

Never commit `.env` files or storage credentials.

## Commands

```bash
npm run dev:hono
npm run check-types --workspace hono
npm run lint
```

## API Base Path

All routes are mounted below `/api`:

- `/api/auth`
- `/api/file-ops`
- `/api/scripts`
- `/api/votes`
- `/api/comments`
- `/api/flags`
- `/api/profiles`
- `/api/universities`
- `/api/faculties`
- `/api/professors`
- `/api/subjects`
- `/api/internal`

The complete endpoint, authentication, authorization, validation, and error reference is in [API_DOCUMENTATION.md](src/routes/API_DOCUMENTATION.md).

## Security Notes

- Public catalog routes (`/api/universities`, `/api/faculties`, `/api/professors`, `/api/subjects`) are read-only.
- User-specific write routes require a valid Supabase session cookie.
- Catalog writes (universities, faculties, professors, subjects, and role changes) are only exposed on `/api/internal` and require the `x-internal-secret` header to match `INTERNAL_API_SECRET`.
- Role updates are never exposed on the public profile routes.
- Moderator access is only used for moderator-only reads and for own-flag mutation checks.
- Route parameters are validated before database operations.
- Uploads are restricted to PDF, DOC, and DOCX files.
- R2 and Supabase credentials must be supplied through environment variables.
