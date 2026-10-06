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
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export {
  API_URL,
  buildContext,
  isBuild,
  isDeployPreview,
  isDev,
  isProd,
  isStaging,
}
