/** The admin download review (`GET /api/download-review/*`): the accounts and
 * scripts whose recent download pattern is worth a look, plus the individual
 * events behind one of them. */
import type { SortDirection } from '../utils/array-utils/sort'

/** Which dedupe key a counted download used: the account, else the address,
 * else the device (see `resolveDownloadIdentity` in the scripts route). */
export type DownloadReviewIdentityType = 'account' | 'ip' | 'device'

export type DownloadReviewAccount = {
  profile_id: string
  username: string | null
  full_name: string | null
  /** Rows in the window. One row per identity per script at most. */
  events: number
  /** Distinct scripts the account downloaded. */
  scripts: number
  ip_addresses: number
  devices: number
  first_download_at: string
  last_download_at: string
}

export type DownloadReviewScript = {
  script_id: string
  slug: string | null
  /** The site handle of the study the script belongs to: its page lives there. */
  site_slug: string | null
  title: string | null
  events: number
  /** Distinct signed-in accounts that downloaded it. */
  accounts: number
  /** Rows with no account: the address or device was the only identity. */
  anonymous: number
  ip_addresses: number
  devices: number
  first_download_at: string
  last_download_at: string
}

/** One page of the accounts or scripts list. The window fields repeat in both
 * so a list can say what its counts covered. */
export type DownloadReviewListResponse<T> = {
  items: Array<T>
  /** Items matching the search, before paging. */
  total: number
  offset: number
  limit: number
  /** Events the pass aggregated: the newest `window` rows that exist. */
  scanned: number
  /** Rows in `download_events` in total. */
  total_events: number
  window: number
}

export type DownloadReviewListQuery<TSort extends string> = {
  limit: number
  offset: number
  sort: TSort
  order: SortDirection
  /** Case-insensitive match on the account's name or the script's title/slug. */
  search?: string
}

export type DownloadReviewEvent = {
  id: string
  created_at: string
  script_id: string
  script_slug: string | null
  /** The script's study site handle; null when the embed is missing. */
  script_site_slug: string | null
  script_title: string | null
  profile_id: string | null
  username: string | null
  full_name: string | null
  ip_address: string | null
  device_id: string | null
  identity: DownloadReviewIdentityType
}

export type DownloadReviewEventsResponse = {
  events: Array<DownloadReviewEvent>
  /** Events the target has recorded, before paging. */
  total: number
  offset: number
  limit: number
}
