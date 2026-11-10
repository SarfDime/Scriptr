'use client'

import {
  DOWNLOAD_REVIEW_ACCOUNT_SORT_OPTIONS,
  DOWNLOAD_REVIEW_SCRIPT_SORT_OPTIONS,
  type DownloadReviewAccountSortField,
  type DownloadReviewScriptSortField,
} from '@shared/config/shared-constants'
import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import type {
  DownloadReviewAccount,
  DownloadReviewScript,
} from '@shared/types/download-review.types'
import { Box } from '@/components/common/Box'
import { Text } from '@/components/typography/Text'
import { useDownloadReviewList } from '@/hooks/admin/useDownloadReviewList'
import {
  DEFAULT_DOWNLOAD_REVIEW_ACCOUNT_QUERY,
  DEFAULT_DOWNLOAD_REVIEW_SCRIPT_QUERY,
} from '@/lib/admin-download-review-page'
import {
  getDownloadReviewAccounts,
  getDownloadReviewScripts,
} from '@/lib/api/download-review-api'
import type { AdminDownloadReviewViewModel } from '@/types/components/Admin.types'
import type { SelectOptionType } from '@/types/components/Select.types'
import { DownloadReviewAccountItem } from './DownloadReviewAccountItem'
import { DownloadReviewScriptItem } from './DownloadReviewScriptItem'
import { DownloadReviewSection } from './DownloadReviewSection'

const ACCOUNT_SORT_OPTIONS: Array<
  SelectOptionType<DownloadReviewAccountSortField>
> = DOWNLOAD_REVIEW_ACCOUNT_SORT_OPTIONS.map((field) => ({
  id: field,
  value: field,
  label: ADMIN_STRINGS.downloadReviewAccountSortNames[field],
}))

const SCRIPT_SORT_OPTIONS: Array<
  SelectOptionType<DownloadReviewScriptSortField>
> = DOWNLOAD_REVIEW_SCRIPT_SORT_OPTIONS.map((field) => ({
  id: field,
  value: field,
  label: ADMIN_STRINGS.downloadReviewScriptSortNames[field],
}))

/** The suspicious-download review: two searchable, sortable, paginated lists
 * (accounts and scripts) built from the same pass over the newest events, each
 * row opening the events behind it. */
export const DownloadReviewPanel = ({
  initialData,
}: {
  initialData: AdminDownloadReviewViewModel | null
}) => {
  const accounts = useDownloadReviewList<
    DownloadReviewAccountSortField,
    DownloadReviewAccount
  >(
    initialData?.accounts ?? null,
    DEFAULT_DOWNLOAD_REVIEW_ACCOUNT_QUERY,
    (query) => getDownloadReviewAccounts(query)
  )
  const scripts = useDownloadReviewList<
    DownloadReviewScriptSortField,
    DownloadReviewScript
  >(
    initialData?.scripts ?? null,
    DEFAULT_DOWNLOAD_REVIEW_SCRIPT_QUERY,
    (query) => getDownloadReviewScripts(query)
  )

  return (
    <>
      <Box className='ui-stack ui-above gap-2'>
        <Text className='ui-body'>{ADMIN_STRINGS.downloadReviewIntro}</Text>
        {accounts.page && (
          <Text className='ui-caption'>
            {ADMIN_STRINGS.downloadReviewWindow(
              accounts.page.scanned,
              accounts.page.total_events
            )}
          </Text>
        )}
      </Box>

      <DownloadReviewSection
        title={ADMIN_STRINGS.downloadReviewAccountsTitle}
        searchLabel={ADMIN_STRINGS.downloadReviewAccountSearchLabel}
        searchPlaceholder={ADMIN_STRINGS.downloadReviewAccountSearchPlaceholder}
        sortOptions={ACCOUNT_SORT_OPTIONS}
        state={accounts}
        errorText={ADMIN_STRINGS.downloadReviewAccountsLoadError}
        emptyText={ADMIN_STRINGS.downloadReviewEmptyAccounts}
        itemKey={(account) => account.profile_id}
        renderItem={(account) => (
          <DownloadReviewAccountItem account={account} />
        )}
      />

      <DownloadReviewSection
        title={ADMIN_STRINGS.downloadReviewScriptsTitle}
        searchLabel={ADMIN_STRINGS.downloadReviewScriptSearchLabel}
        searchPlaceholder={ADMIN_STRINGS.downloadReviewScriptSearchPlaceholder}
        sortOptions={SCRIPT_SORT_OPTIONS}
        state={scripts}
        errorText={ADMIN_STRINGS.downloadReviewScriptsLoadError}
        emptyText={ADMIN_STRINGS.downloadReviewEmptyScripts}
        itemKey={(script) => script.script_id}
        renderItem={(script) => <DownloadReviewScriptItem script={script} />}
      />
    </>
  )
}
