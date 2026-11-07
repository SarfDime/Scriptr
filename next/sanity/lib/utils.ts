import type { QueryParams } from 'next-sanity'
import type { LivePerspective } from 'next-sanity/live'
import { isProd, isStaging } from '@/config/env'
import { nextLogs } from '@/lib/logger'
import { sanityAuthToken, sanityWebsiteId } from '../env'
import { sanityFunctionQueries } from '../queries/functions.queries'
import { client, prodClient } from './client'

/**
 * One tag for the whole dataset. Nothing expires it today: a Sanity edit reaches
 * readers on the next rebuild, which is the intended mechanism (a Studio action
 * fires a deploy hook). It stays as the hook for tag-based expiry, which is
 * deferred — that would need a tag per query, and `sanityFetch`'s per-document
 * sync tags cannot be computed outside this app.
 */
const SANITY_CACHE_TAG = 'sanity'

/**
 * Drafts are a staging instrument, and getting this wrong is not symmetric:
 * `isProd` comes from `NEXT_PUBLIC_ENVIRONMENT_TYPE`, which is set per
 * deployment by hand and is inlined at build time. When it was missing on
 * Vercel, production took the drafts branch and served unpublished documents as
 * if they were live. `VERCEL_ENV` is server-only and always set by Vercel, so a
 * real production deployment cannot fall into that branch; being server-only,
 * it also cannot disagree between the server and the browser.
 */
const isProductionDeployment = isProd || process.env.VERCEL_ENV === 'production'

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

    // One read per environment, not two: production sees published documents,
    // every other environment sees drafts (which is what staging has always
    // shown), and only staging carries stega marks for the Studio.
    const data = await (isProductionDeployment
      ? prodClient
      : client
    ).fetch<QueryResponse>(mergedQuery, mergedParams, {
      perspective: isProductionDeployment ? 'published' : perspective,
      stega: isStaging ? stega : false,
      // Drafts are only readable with a token. `sanityFetch` used to attach
      // `serverToken` for exactly this; without it a drafts read silently
      // returns published documents, which dropped every page whose slug only
      // exists in the draft from `generateStaticParams`.
      token: isProductionDeployment ? undefined : sanityAuthToken,
      // Sanity reads are cached until the next build; the `sanity` tag can
      // expire them manually.
      next: {
        revalidate: false,
        tags: [SANITY_CACHE_TAG],
      },
    })

    return data
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
