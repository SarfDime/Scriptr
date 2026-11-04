// Environment Type
const buildContext:
  | 'development'
  | 'staging'
  | 'production'
  | 'deploy_preview' =
  (process.env.NEXT_PUBLIC_ENVIRONMENT_TYPE as
    | 'development'
    | 'staging'
    | 'production'
    | 'deploy_preview') ?? 'development'

const isBuild = process.env.BUILD_ENV === 'true'
const isProd = buildContext === 'production'
const isStaging = buildContext === 'staging'
const isDeployPreview = buildContext === 'deploy_preview'
const isDev =
  process.env.NEXT_PUBLIC_ENVIRONMENT_TYPE === 'development' ||
  !process.env.NEXT_PUBLIC_ENVIRONMENT_TYPE

// API
//
// The API origin (e.g. https://api.scriptr.uk). The API sets the session cookie
// with `Domain=.scriptr.uk`, so the web app and Server Components see it too.
// Inlined at build time: redeploy after changing it.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

// `SITEMAP_SECRET` is deliberately not read here: this module is imported by
// client code. It lives in `lib/api/sitemap-api.ts` (`server-only`).

export {
  API_URL,
  buildContext,
  isBuild,
  isDeployPreview,
  isDev,
  isProd,
  isStaging,
}
