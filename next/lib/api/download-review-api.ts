import { apiRoutes, withQuery } from '@shared/config/api-routes'
import type {
  DownloadReviewAccountSortField,
  DownloadReviewScriptSortField,
} from '@shared/config/shared-constants'
import type {
  DownloadReviewAccount,
  DownloadReviewEventsResponse,
  DownloadReviewListQuery,
  DownloadReviewListResponse,
  DownloadReviewScript,
} from '@shared/types/download-review.types'
import { apiFetchRequired } from './next-api'

const noStore = { cache: 'no-store' } as const

const withCookie = (cookie?: string) => (cookie ? { headers: { cookie } } : {})

export const getDownloadReviewAccounts = (
  query: DownloadReviewListQuery<DownloadReviewAccountSortField>,
  cookie?: string
) =>
  apiFetchRequired<DownloadReviewListResponse<DownloadReviewAccount>>(
    withQuery(apiRoutes.downloadReview.accounts, {
      limit: query.limit,
      offset: query.offset,
      sort: query.sort,
      order: query.order,
      search: query.search,
    }),
    { ...noStore, ...withCookie(cookie) }
  )

export const getDownloadReviewScripts = (
  query: DownloadReviewListQuery<DownloadReviewScriptSortField>,
  cookie?: string
) =>
  apiFetchRequired<DownloadReviewListResponse<DownloadReviewScript>>(
    withQuery(apiRoutes.downloadReview.scripts, {
      limit: query.limit,
      offset: query.offset,
      sort: query.sort,
      order: query.order,
      search: query.search,
    }),
    { ...noStore, ...withCookie(cookie) }
  )

/** The events behind one account or one script — exactly one of the two. */
export const getDownloadReviewEvents = (
  query: {
    script_id?: string
    user_id?: string
    limit?: number
    offset?: number
  },
  cookie?: string
) =>
  apiFetchRequired<DownloadReviewEventsResponse>(
    withQuery(apiRoutes.downloadReview.events, query),
    { ...noStore, ...withCookie(cookie) }
  )
