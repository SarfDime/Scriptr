import { createClient } from '@sanity/client'
import {
  API_VERSION,
  SANITY_DATASET,
  SANITY_PROJECT_ID,
} from '@shared/config/sanity-constants'

// The client can be used to interact with the Sanity API to fetch and mutate documents in the specified dataset.
export const clientFetch = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  useCdn: true,
  apiVersion: API_VERSION,
})
