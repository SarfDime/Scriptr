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

// The catalog's public origin (e.g. https://scriptr.uk). A study is served at
// `<siteSlug>.<this host>`, so this value is also the base every study hostname
// and canonical is derived from. Inlined at build time.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? ''

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
  SITE_URL,
}
