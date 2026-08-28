import { createClient } from 'next-sanity'

const token = process.env.SANITY_AUTH_TOKEN
const isProd = process.env.NEXT_PUBLIC_ENVIRONMENT_TYPE === 'production' // This env is only available on production context.

export const client = createClient({
  // TODO: add real values
  projectId: '',
  dataset: '',
  apiVersion: '2026-01-01', // use current UTC date - see "specifying API version"!
  // or leave blank for unauthenticated usage
  token,
  // useCdn should be true, unless you want to ensure fresh data. In the case below, we get fresh data only if there is a staging token. That means only on local and staging environment.
  useCdn: isProd,
  perspective: isProd ? 'published' : 'drafts', // Local and staging/deploy-preview build should both use drafts, that's because when using raw too much data is shown and doesn't make for a good testing environment.
})
