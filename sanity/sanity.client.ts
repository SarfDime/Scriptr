import { createClient } from '@sanity/client'
import { API_VERSION } from '@shared/config/sanity-constants'
import { sanityDataset, sanityProjectId } from './env'

// The client can be used to interact with the Sanity API to fetch and mutate documents in the specified dataset.
export const clientFetch = createClient({
  projectId: sanityProjectId,
  dataset: sanityDataset,
  useCdn: true,
  apiVersion: API_VERSION,
})
