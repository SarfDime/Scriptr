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

// Shared secret for the API's internal routes (`x-internal-secret`). Server-only:
// no `NEXT_PUBLIC_` prefix, so it never reaches the browser bundle. Used by the
// sitemap, whose full script list the public API no longer serves.
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET ?? ''

export {
  API_URL,
  buildContext,
  INTERNAL_API_SECRET,
  isBuild,
  isDeployPreview,
  isDev,
  isProd,
  isStaging,
}
