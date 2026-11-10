import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DOWNLOAD_REVIEW_EVENT_PAGE_SIZE,
  DOWNLOAD_REVIEW_MAX_EVENT_PAGE_SIZE,
  DOWNLOAD_REVIEW_MAX_PAGE_SIZE,
  DOWNLOAD_REVIEW_PAGE_SIZE,
} from '../../../shared/config/shared-constants'
import {
  parseDownloadReviewEventsQuery,
  parseDownloadReviewListQuery,
} from './download-review-query'

const SORTS = ['events', 'scripts', 'last_download_at'] as const

const parseList = (query: Record<string, string> = {}) =>
  parseDownloadReviewListQuery((name) => query[name], {
    sorts: SORTS,
    defaultSort: 'events',
  })

test('defaults to the first page, sorted by volume, newest first', () => {
  assert.deepEqual(parseList(), {
    limit: DOWNLOAD_REVIEW_PAGE_SIZE,
    offset: 0,
    sort: 'events',
    order: 'desc',
  })
})

test('reads paging, a sort column, a direction and a search term', () => {
  assert.deepEqual(
    parseList({
      limit: '25',
      offset: '50',
      sort: 'last_download_at',
      order: 'asc',
      search: ' ana ',
    }),
    {
      limit: 25,
      offset: 50,
      sort: 'last_download_at',
      order: 'asc',
      search: 'ana',
    }
  )
})

test('rejects paging and sorting it cannot honour', () => {
  const invalid: Array<Record<string, string>> = [
    { limit: '0' },
    { limit: 'nope' },
    { limit: String(DOWNLOAD_REVIEW_MAX_PAGE_SIZE + 1) },
    { offset: '-1' },
    { offset: '1.5' },
    { sort: 'username' },
    { order: 'sideways' },
  ]

  for (const query of invalid) {
    assert.equal(parseList(query), null, JSON.stringify(query))
  }
})

test('an empty search is no filter at all', () => {
  assert.deepEqual(parseList({ search: '   ' }), {
    limit: DOWNLOAD_REVIEW_PAGE_SIZE,
    offset: 0,
    sort: 'events',
    order: 'desc',
  })
})

test('the events list pages with its own size and rejects bad paging', () => {
  assert.deepEqual(
    parseDownloadReviewEventsQuery(() => undefined),
    {
      limit: DOWNLOAD_REVIEW_EVENT_PAGE_SIZE,
      offset: 0,
    }
  )

  const fromQuery = (query: Record<string, string>) => (name: string) =>
    query[name]

  assert.deepEqual(
    parseDownloadReviewEventsQuery(fromQuery({ limit: '5', offset: '10' })),
    { limit: 5, offset: 10 }
  )

  assert.equal(
    parseDownloadReviewEventsQuery((name) =>
      name === 'limit'
        ? String(DOWNLOAD_REVIEW_MAX_EVENT_PAGE_SIZE + 1)
        : undefined
    ),
    null
  )
})
