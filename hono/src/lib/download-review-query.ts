import {
  DOWNLOAD_REVIEW_EVENT_PAGE_SIZE,
  DOWNLOAD_REVIEW_MAX_EVENT_PAGE_SIZE,
  DOWNLOAD_REVIEW_MAX_PAGE_SIZE,
  DOWNLOAD_REVIEW_PAGE_SIZE,
} from '../../../shared/config/shared-constants'
import type { DownloadReviewListQuery } from '../../../shared/types/download-review.types'
import type { SortDirection } from '../../../shared/utils/array-utils/sort'

type ListQueryOptions<TSort extends string> = {
  sorts: ReadonlyArray<TSort>
  defaultSort: TSort
}

const paging = (
  get: (name: string) => string | undefined,
  pageSize: number,
  maxPageSize: number
) => {
  const rawLimit = get('limit')
  const rawOffset = get('offset')
  const limit = rawLimit === undefined ? pageSize : Number(rawLimit)
  const offset = rawOffset === undefined ? 0 : Number(rawOffset)

  if (
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > maxPageSize ||
    !Number.isSafeInteger(offset) ||
    offset < 0
  ) {
    return null
  }

  return { limit, offset }
}

const readOrder = (get: (name: string) => string | undefined) => {
  const rawOrder = get('order') ?? 'desc'
  if (rawOrder !== 'asc' && rawOrder !== 'desc') return null
  return rawOrder satisfies SortDirection
}

/**
 * Validates the accounts or scripts list query. `get` is the route's
 * `c.req.query`, so the parsing can be unit-tested without a request.
 *
 * `null` means the caller asked for a page, ordering or sort column this route
 * cannot honour, which the route answers with a `400` rather than silently
 * substituting a default.
 */
export function parseDownloadReviewListQuery<TSort extends string>(
  get: (name: string) => string | undefined,
  { sorts, defaultSort }: ListQueryOptions<TSort>
): DownloadReviewListQuery<TSort> | null {
  const page = paging(
    get,
    DOWNLOAD_REVIEW_PAGE_SIZE,
    DOWNLOAD_REVIEW_MAX_PAGE_SIZE
  )
  if (!page) return null

  const order = readOrder(get)
  if (!order) return null

  const rawSort = get('sort') ?? defaultSort
  const sort = sorts.find((option) => option === rawSort)
  if (!sort) return null

  const search = get('search')?.trim()

  return {
    ...page,
    sort,
    order,
    ...(search ? { search } : {}),
  }
}

/** The events list takes paging only; the route validates the target. */
export const parseDownloadReviewEventsQuery = (
  get: (name: string) => string | undefined
) =>
  paging(
    get,
    DOWNLOAD_REVIEW_EVENT_PAGE_SIZE,
    DOWNLOAD_REVIEW_MAX_EVENT_PAGE_SIZE
  )
