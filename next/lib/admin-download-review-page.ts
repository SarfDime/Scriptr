import {
  DEFAULT_DOWNLOAD_REVIEW_ACCOUNT_QUERY,
  DEFAULT_DOWNLOAD_REVIEW_SCRIPT_QUERY,
} from '@shared/config/shared-constants'
import type { AdminDownloadReviewViewModel } from '@/types/components/Admin.types'
import { getSelectedAdminStudy } from './admin-study-server'
import {
  getDownloadReviewAccounts,
  getDownloadReviewScripts,
} from './api/download-review-api'

/** First page of both lists. `null` when the API refused or was unreachable,
 * which each section renders as its error state. */
export const loadAdminDownloadReviewPage = async (
  cookie: string
): Promise<AdminDownloadReviewViewModel | null> => {
  try {
    const study = await getSelectedAdminStudy()
    const [accounts, scripts] = await Promise.all([
      getDownloadReviewAccounts(
        DEFAULT_DOWNLOAD_REVIEW_ACCOUNT_QUERY,
        cookie,
        study
      ),
      getDownloadReviewScripts(
        DEFAULT_DOWNLOAD_REVIEW_SCRIPT_QUERY,
        cookie,
        study
      ),
    ])
    return { accounts, scripts, study }
  } catch {
    return null
  }
}
