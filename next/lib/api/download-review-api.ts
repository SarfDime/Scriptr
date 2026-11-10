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
  cookie?: string,
  study?: string | null
) =>
  apiFetchRequired<DownloadReviewListResponse<DownloadReviewAccount>>(
    withQuery(apiRoutes.downloadReview.accounts, {
      limit: query.limit,
      offset: query.offset,
      sort: query.sort,
      order: query.order,
      search: query.search,
      study: study ?? undefined,
    }),
    { ...noStore, ...withCookie(cookie) }
  )

export const getDownloadReviewScripts = (
  query: DownloadReviewListQuery<DownloadReviewScriptSortField>,
  cookie?: string,
  study?: string | null
) =>
  apiFetchRequired<DownloadReviewListResponse<DownloadReviewScript>>(
    withQuery(apiRoutes.downloadReview.scripts, {
      limit: query.limit,
      offset: query.offset,
      sort: query.sort,
      order: query.order,
      search: query.search,
      study: study ?? undefined,
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
    study?: string | null
  },
  cookie?: string
) =>
  apiFetchRequired<DownloadReviewEventsResponse>(
    withQuery(apiRoutes.downloadReview.events, {
      ...query,
      study: query.study ?? undefined,
    }),
    { ...noStore, ...withCookie(cookie) }
  )
