import type { QueryParams } from 'next-sanity'
import type { LivePerspective } from 'next-sanity/live'
import { isProd, isStaging } from '@/config/env'
import { nextLogs } from '@/lib/logger'
import { sanityWebsiteId } from '../env'
import { sanityFunctionQueries } from '../queries/functions.queries'
import { prodClient } from './client'
import { sanityFetch } from './live'

export type FetchSanityLiveProps = {
  perspective?: LivePerspective
  stega?: boolean
}
export type FetchSanityDataParams = {
  query: string
  params?: QueryParams & { slug?: string | null }
  fetchOrigin: string
} & FetchSanityLiveProps

/**
 * Fetches data from Sanity based on the given query and params.
 *
 * `query` - The Sanity query to be executed.
 * `params` - The query parameters to be used.
 */
async function fetchSanityData<QueryResponse>({
  query,
  params = {},
  fetchOrigin,
  perspective = 'drafts',
  stega = true,
}: FetchSanityDataParams): Promise<QueryResponse> {
  try {
    const { ...rest } = params

    const defaultParams = {
      WEBSITE: sanityWebsiteId,
      pageType: 'page',
      pageTypes: ['page', 'aiPage'],
    }
    const mergedParams = { ...defaultParams, ...rest }

    const mergedQuery = sanityFunctionQueries + query

    const { data } = await sanityFetch({
      query: mergedQuery,
      params: mergedParams,
      perspective,
      stega: isStaging ? stega : false,
    })

    const prodData = isProd
      ? await prodClient.fetch<QueryResponse>(mergedQuery, mergedParams)
      : (null as QueryResponse)

    return isProd ? prodData : (data as QueryResponse)
  } catch (error) {
    nextLogs({
      logLevel: 'error',
      error,
      message: `fetchSanityData() - "${fetchOrigin}" - Failed to fetch sanity data.`,
    })
    throw error
  }
}

export { fetchSanityData }
