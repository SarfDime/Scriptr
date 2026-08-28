# Scriptr API

A Hono-based REST API for managing faculty scripts with authentication, file uploads, and voting functionality.

## Features

- **Authentication**: User registration and login with Supabase
- **File Management**: Upload scripts to Cloudflare R2 through the API
- **Database**: Supabase PostgreSQL for storing scripts and user data
- **Authorization**: Role-based access control (student, admin, moderator)
- **Voting System**: Up-vote/down-vote scripts

## Tech Stack

- **Framework**: [Hono](https://hono.dev/)
- **Authentication**: [Supabase](https://supabase.com/)
- **Storage**: [Cloudflare R2](https://developers.cloudflare.com/r2/)
- **Database**: PostgreSQL (Supabase)
- **AWS SDK**: S3 client for R2 operations

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env.local` file with the following values in Vercel (use secrets for credentials):

```
SUPABASE_URL=your_supabase_url
SUPABASE_API_KEY=your_api_key
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET=your_bucket_name
R2_PUBLIC_URL=https://your-public-r2-domain
NEXT_PUBLIC_API_URL=https://your-api.vercel.app
```

## Scripts

- `npm run dev` - Start development server
- `npm run dev` - Start the Node.js API locally
- `npm run tsc` - Check API types

## API Routes

### Auth
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/session` - Get current session
- `POST /api/auth/refresh` - Refresh token

### File Operations
- `POST /api/file-ops/upload` - Upload a multipart file and create its script metadata
- `GET /api/file-ops/get-file/*` - Get signed file url (supports paths with directories)
- `POST /api/file-ops/record` - Create script record
- `GET /api/file-ops/my-uploads` - User's uploaded scripts

### Scripts
- `GET /api/scripts` - List all scripts
- `POST /api/scripts` - Create script
- `POST /api/scripts/:id/vote` - Vote on script
