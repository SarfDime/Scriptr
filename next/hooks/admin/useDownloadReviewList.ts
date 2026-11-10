'use client'

import type {
  DownloadReviewListQuery,
  DownloadReviewListResponse,
} from '@shared/types/download-review.types'
import { useState } from 'react'

export type DownloadReviewListState<TItem, TSort extends string> = {
  page: DownloadReviewListResponse<TItem> | null
  query: DownloadReviewListQuery<TSort>
  loading: boolean
  loadError: boolean
  /** Search and sort changes restart at the first page: staying on page 4 of a
   * different ordering shows rows nobody asked for. */
  changeQuery: (patch: Partial<DownloadReviewListQuery<TSort>>) => void
  changePage: (offset: number) => void
  retry: () => void
}

/** Load state of one download-review list: the page the server rendered plus
 * every later read through the same endpoint. */
export function useDownloadReviewList<TSort extends string, TItem>(
  initialPage: DownloadReviewListResponse<TItem> | null,
  initialQuery: DownloadReviewListQuery<TSort>,
  fetchPage: (
    query: DownloadReviewListQuery<TSort>
  ) => Promise<DownloadReviewListResponse<TItem>>
): DownloadReviewListState<TItem, TSort> {
  const [query, setQuery] = useState(initialQuery)
  const [page, setPage] = useState(initialPage)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(initialPage === null)

  const load = (next: DownloadReviewListQuery<TSort>) => {
    setQuery(next)
    setLoading(true)
    setLoadError(false)
    return fetchPage(next)
      .then((result) => {
        setPage(result)
        setLoading(false)
      })
      .catch(() => {
        setLoadError(true)
        setLoading(false)
      })
  }

  return {
    page,
    query,
    loading,
    loadError,
    changeQuery: (patch) => load({ ...query, ...patch, offset: 0 }),
    changePage: (offset) => load({ ...query, offset }),
    retry: () => load(query),
  }
}
