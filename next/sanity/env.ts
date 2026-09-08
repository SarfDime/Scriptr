// Website ID
const sanityWebsiteId = process.env.NEXT_PUBLIC_SANITY_WEBSITE_ID
const websiteDomain =
  process.env.NETLIFY_WEBSITE_DOMAIN ?? 'TODO: WEBSITE_DOMAIN for production'

// SANITY
const sanityAuthToken = process.env.SANITY_AUTH_TOKEN
const studioURL = process.env.NEXT_PUBLIC_SANITY_STUDIO_URL
const sanityProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const sanityDataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const sanityApiVersion = '2026-08-08'

export {
  sanityApiVersion,
  sanityAuthToken,
  sanityDataset,
  sanityProjectId,
  sanityWebsiteId,
  studioURL,
  websiteDomain,
}
