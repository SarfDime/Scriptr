const projectId = process.env.SANITY_STUDIO_PROJECT_ID?.trim()

if (!projectId) {
  throw new Error(
    'SANITY_STUDIO_PROJECT_ID is not set. Copy sanity/.env.example to sanity/.env and fill it in.'
  )
}

/** Public project identifier. Vite inlines it into the Studio bundle. */
export const sanityProjectId = projectId
export const sanityDataset =
  process.env.SANITY_STUDIO_DATASET?.trim() || 'production'
/** Only `sanity deploy` needs it; the hosted Studio keeps its own app id. */
export const sanityAppId = process.env.SANITY_STUDIO_APP_ID?.trim()
