import {
  DOWNLOAD_REVIEW_PAGE_SIZE,
  type DownloadReviewAccountSortField,
  type DownloadReviewScriptSortField,
} from '@shared/config/shared-constants'
import type { DownloadReviewListQuery } from '@shared/types/download-review.types'
import type { AdminDownloadReviewViewModel } from '@/types/components/Admin.types'
import {
  getDownloadReviewAccounts,
  getDownloadReviewScripts,
} from './api/download-review-api'

/** Both lists start on the busiest first, one page each. */
export const DEFAULT_DOWNLOAD_REVIEW_ACCOUNT_QUERY: DownloadReviewListQuery<DownloadReviewAccountSortField> =
  { limit: DOWNLOAD_REVIEW_PAGE_SIZE, offset: 0, sort: 'events', order: 'desc' }
export const DEFAULT_DOWNLOAD_REVIEW_SCRIPT_QUERY: DownloadReviewListQuery<DownloadReviewScriptSortField> =
  { limit: DOWNLOAD_REVIEW_PAGE_SIZE, offset: 0, sort: 'events', order: 'desc' }

/** First page of both lists. `null` when the API refused or was unreachable,
 * which each section renders as its error state. */
export const loadAdminDownloadReviewPage = async (
  cookie: string
): Promise<AdminDownloadReviewViewModel | null> => {
  try {
    const [accounts, scripts] = await Promise.all([
      getDownloadReviewAccounts(DEFAULT_DOWNLOAD_REVIEW_ACCOUNT_QUERY, cookie),
      getDownloadReviewScripts(DEFAULT_DOWNLOAD_REVIEW_SCRIPT_QUERY, cookie),
    ])
    return { accounts, scripts }
  } catch {
    return null
  }
}
