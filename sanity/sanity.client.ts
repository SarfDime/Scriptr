import { createClient } from '@sanity/client'
import { API_VERSION } from '@shared/config/sanity-constants'

// The client can be used to interact with the Sanity API to fetch and mutate documents in the specified dataset.
export const clientFetch = createClient({
  projectId: 'hl9czw39',
  dataset: 'production',
  useCdn: true,
  apiVersion: API_VERSION,
})
