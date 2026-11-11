import type {
  DownloadReviewAccountSortField,
  DownloadReviewScriptSortField,
} from '../../../shared/config/shared-constants'
import type {
  DownloadReviewAccount,
  DownloadReviewIdentityType,
  DownloadReviewListQuery,
  DownloadReviewScript,
} from '../../../shared/types/download-review.types'

/** The newest `download_events` rows one review pass aggregates. The table is
 * append-only and one row is one counted download, so the pass is bounded: the
 * lists report what the window covered instead of reading the whole history. */
export const DOWNLOAD_REVIEW_WINDOW = 2000

/** One raw `download_events` row, as the review reads it: the identity columns
 * plus the account and script names the lists show. */
export type DownloadReviewEventRow = {
  script_id: string
  /** The study of the downloaded script; null when the embed is missing. */
  study_id: string | null
  user_id: string | null
  ip_address: string | null
  device_id: string | null
  identity_key: string
  created_at: string
  username: string | null
  full_name: string | null
  script_slug: string | null
  /** The downloaded script's study site handle; null when the embed is missing. */
  script_site_slug: string | null
  script_title: string | null
}

export type DownloadReviewAggregate = {
  accounts: Array<DownloadReviewAccount>
  scripts: Array<DownloadReviewScript>
}

/** Which identity a row was counted under. `download_events` stores the key as
 * `account:<id>`, `ip:<address>` or `device:<id>`. */
export const downloadReviewIdentityType = (
  identityKey: string
): DownloadReviewIdentityType => {
  if (identityKey.startsWith('account:')) return 'account'
  if (identityKey.startsWith('ip:')) return 'ip'
  return 'device'
}

/** Both summaries are built from the same per-key counts: an account bucket
 * reads `scripts`/`addresses`/`devices`, a script bucket reads
 * `accounts`/`anonymous`. */
type Bucket = {
  events: number
  scripts: Set<string>
  accounts: Set<string>
  anonymous: number
  addresses: Set<string>
  devices: Set<string>
  username: string | null
  fullName: string | null
  slug: string | null
  siteSlug: string | null
  title: string | null
  firstAt: string
  firstMs: number | null
  lastAt: string
  lastMs: number | null
}

const createBucket = (): Bucket => ({
  events: 0,
  scripts: new Set(),
  accounts: new Set(),
  anonymous: 0,
  addresses: new Set(),
  devices: new Set(),
  username: null,
  fullName: null,
  slug: null,
  siteSlug: null,
  title: null,
  firstAt: '',
  firstMs: null,
  lastAt: '',
  lastMs: null,
})

const time = (value: string) => {
  const ms = Date.parse(value)
  return Number.isNaN(ms) ? 0 : ms
}

const track = (bucket: Bucket, row: DownloadReviewEventRow) => {
  bucket.events += 1
  bucket.scripts.add(row.script_id)
  if (row.user_id) bucket.accounts.add(row.user_id)
  else bucket.anonymous += 1
  if (row.ip_address) bucket.addresses.add(row.ip_address)
  if (row.device_id) bucket.devices.add(row.device_id)

  // Rows arrive newest first, so the first name a bucket sees is the current
  // one — a renamed account or script shows its latest name, not a stale one.
  bucket.username ??= row.username
  bucket.fullName ??= row.full_name
  bucket.slug ??= row.script_slug
  bucket.siteSlug ??= row.script_site_slug
  bucket.title ??= row.script_title

  const ms = time(row.created_at)
  if (bucket.firstMs === null || ms < bucket.firstMs) {
    bucket.firstMs = ms
    bucket.firstAt = row.created_at
  }
  if (bucket.lastMs === null || ms > bucket.lastMs) {
    bucket.lastMs = ms
    bucket.lastAt = row.created_at
  }
}

/** Highest volume first, then the most recently active, then the key itself so
 * the order is stable between two passes over the same data. Paging and sorting
 * happen on top of this, which is also the tie-break order. */
const ranked = (buckets: Map<string, Bucket>) =>
  [...buckets.entries()].sort(
    ([keyA, a], [keyB, b]) =>
      b.events - a.events ||
      (b.lastMs ?? 0) - (a.lastMs ?? 0) ||
      keyA.localeCompare(keyB)
  )

/** Counts the window into the two lists the review shows, most suspicious
 * first. Every account and script in the window is returned: the lists are
 * paged and filtered afterwards, not here. */
export const aggregateDownloadReview = (
  rows: Array<DownloadReviewEventRow>
): DownloadReviewAggregate => {
  const accounts = new Map<string, Bucket>()
  const scripts = new Map<string, Bucket>()

  for (const row of rows) {
    if (row.user_id) {
      let account = accounts.get(row.user_id)
      if (!account) {
        account = createBucket()
        accounts.set(row.user_id, account)
      }
      track(account, row)
    }

    let script = scripts.get(row.script_id)
    if (!script) {
      script = createBucket()
      scripts.set(row.script_id, script)
    }
    track(script, row)
  }

  return {
    accounts: ranked(accounts).map(([profileId, bucket]) => ({
      profile_id: profileId,
      username: bucket.username,
      full_name: bucket.fullName,
      events: bucket.events,
      scripts: bucket.scripts.size,
      ip_addresses: bucket.addresses.size,
      devices: bucket.devices.size,
      first_download_at: bucket.firstAt,
      last_download_at: bucket.lastAt,
    })),
    scripts: ranked(scripts).map(([scriptId, bucket]) => ({
      script_id: scriptId,
      slug: bucket.slug,
      site_slug: bucket.siteSlug,
      title: bucket.title,
      events: bucket.events,
      accounts: bucket.accounts.size,
      anonymous: bucket.anonymous,
      ip_addresses: bucket.addresses.size,
      devices: bucket.devices.size,
      first_download_at: bucket.firstAt,
      last_download_at: bucket.lastAt,
    })),
  }
}

const matchesSearch = (values: Array<string | null>, search: string) => {
  const needle = search.trim().toLowerCase()
  if (!needle) return true

  return values.some((value) => (value ?? '').toLowerCase().includes(needle))
}

type PageOptions<T, TSort extends string> = {
  query: DownloadReviewListQuery<TSort>
  matches: (item: T) => boolean
  sortValue: (item: T, sort: TSort) => number
}

/** Filters, sorts and slices one list. The input keeps the aggregate's ranking,
 * and `Array.prototype.sort` is stable, so equal values stay in that order —
 * the most active first, which is the useful order to tie on. */
const pageItems = <T, TSort extends string>(
  items: Array<T>,
  { query, matches, sortValue }: PageOptions<T, TSort>
) => {
  const direction = query.order === 'asc' ? 1 : -1
  const sorted = items
    .filter(matches)
    .sort(
      (a, b) =>
        (sortValue(a, query.sort) - sortValue(b, query.sort)) * direction
    )

  return {
    items: sorted.slice(query.offset, query.offset + query.limit),
    total: sorted.length,
  }
}

/** One accessor per sortable column, so the record is exhaustive: adding a
 * sort option without its value fails to compile. */
const ACCOUNT_SORT_VALUES: Record<
  DownloadReviewAccountSortField,
  (account: DownloadReviewAccount) => number
> = {
  events: (account) => account.events,
  scripts: (account) => account.scripts,
  ip_addresses: (account) => account.ip_addresses,
  devices: (account) => account.devices,
  last_download_at: (account) => time(account.last_download_at),
}

const SCRIPT_SORT_VALUES: Record<
  DownloadReviewScriptSortField,
  (script: DownloadReviewScript) => number
> = {
  events: (script) => script.events,
  accounts: (script) => script.accounts,
  anonymous: (script) => script.anonymous,
  ip_addresses: (script) => script.ip_addresses,
  devices: (script) => script.devices,
  last_download_at: (script) => time(script.last_download_at),
}

export const pageDownloadReviewAccounts = (
  accounts: Array<DownloadReviewAccount>,
  query: DownloadReviewListQuery<DownloadReviewAccountSortField>
) =>
  pageItems(accounts, {
    query,
    matches: (account) =>
      matchesSearch([account.username, account.full_name], query.search ?? ''),
    sortValue: (account, sort) => ACCOUNT_SORT_VALUES[sort](account),
  })

export const pageDownloadReviewScripts = (
  scripts: Array<DownloadReviewScript>,
  query: DownloadReviewListQuery<DownloadReviewScriptSortField>
) =>
  pageItems(scripts, {
    query,
    matches: (script) =>
      matchesSearch([script.title, script.slug], query.search ?? ''),
    sortValue: (script, sort) => SCRIPT_SORT_VALUES[sort](script),
  })
