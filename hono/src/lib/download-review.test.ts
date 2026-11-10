import assert from 'node:assert/strict'
import test from 'node:test'
import {
  aggregateDownloadReview,
  type DownloadReviewEventRow,
  downloadReviewIdentityType,
  pageDownloadReviewAccounts,
  pageDownloadReviewScripts,
} from './download-review'

const event = (
  overrides: Partial<DownloadReviewEventRow> = {}
): DownloadReviewEventRow => ({
  script_id: 'script-1',
  study_id: 'study-1',
  user_id: 'user-1',
  ip_address: '203.0.113.7',
  device_id: 'device-1',
  identity_key: 'account:user-1',
  created_at: '2026-11-01T10:00:00+00:00',
  username: 'student',
  full_name: 'Student One',
  script_slug: 'script-one',
  script_title: 'Script One',
  ...overrides,
})

const accountQuery = (overrides: Record<string, unknown> = {}) => ({
  limit: 10,
  offset: 0,
  sort: 'events' as const,
  order: 'desc' as const,
  ...overrides,
})

const scriptQuery = (overrides: Record<string, unknown> = {}) => ({
  limit: 10,
  offset: 0,
  sort: 'events' as const,
  order: 'desc' as const,
  ...overrides,
})

test('reads the identity a row was counted under from its key', () => {
  assert.equal(downloadReviewIdentityType('account:abc'), 'account')
  assert.equal(downloadReviewIdentityType('ip:203.0.113.7'), 'ip')
  assert.equal(downloadReviewIdentityType('device:abc'), 'device')
})

test('counts an account by its scripts, addresses and devices', () => {
  const { accounts } = aggregateDownloadReview([
    event({ script_id: 'script-1', device_id: 'device-1' }),
    event({
      script_id: 'script-2',
      device_id: 'device-2',
      created_at: '2026-10-30T08:00:00+00:00',
    }),
    event({ script_id: 'script-2', ip_address: '198.51.100.4' }),
  ])

  assert.deepEqual(accounts, [
    {
      profile_id: 'user-1',
      username: 'student',
      full_name: 'Student One',
      events: 3,
      scripts: 2,
      ip_addresses: 2,
      devices: 2,
      first_download_at: '2026-10-30T08:00:00+00:00',
      last_download_at: '2026-11-01T10:00:00+00:00',
    },
  ])
})

test('separates a script’s accounts from its anonymous downloads', () => {
  const { scripts } = aggregateDownloadReview([
    event({ user_id: 'user-1', identity_key: 'account:user-1' }),
    event({
      user_id: 'user-2',
      username: 'second',
      identity_key: 'account:user-2',
    }),
    event({
      user_id: null,
      username: null,
      full_name: null,
      device_id: null,
      ip_address: '198.51.100.4',
      identity_key: 'ip:198.51.100.4',
    }),
  ])

  assert.deepEqual(scripts, [
    {
      script_id: 'script-1',
      slug: 'script-one',
      title: 'Script One',
      events: 3,
      accounts: 2,
      anonymous: 1,
      ip_addresses: 2,
      devices: 1,
      first_download_at: '2026-11-01T10:00:00+00:00',
      last_download_at: '2026-11-01T10:00:00+00:00',
    },
  ])
})

test('anonymous downloads do not create an account row', () => {
  const { accounts } = aggregateDownloadReview([
    event({ user_id: null, username: null, identity_key: 'device:device-1' }),
  ])

  assert.deepEqual(accounts, [])
})

test('the newest name wins, so a renamed account shows its current name', () => {
  // Rows arrive newest first, as the route reads them.
  const { accounts } = aggregateDownloadReview([
    event({ username: 'new-name', created_at: '2026-11-02T10:00:00+00:00' }),
    event({ username: 'old-name', created_at: '2026-10-01T10:00:00+00:00' }),
  ])

  assert.equal(accounts[0]?.username, 'new-name')
})

test('ranks by volume, then the latest activity', () => {
  const { scripts } = aggregateDownloadReview([
    event({ script_id: 'quiet-recent', created_at: '2026-11-02T10:00:00Z' }),
    event({ script_id: 'busy', created_at: '2026-10-01T10:00:00Z' }),
    event({
      script_id: 'busy',
      user_id: 'user-2',
      identity_key: 'account:user-2',
    }),
    event({ script_id: 'quiet-stale', created_at: '2026-09-01T10:00:00Z' }),
  ])

  assert.deepEqual(
    scripts.map((script) => [script.script_id, script.events]),
    [
      ['busy', 2],
      ['quiet-recent', 1],
      ['quiet-stale', 1],
    ]
  )
})

test('keeps the order stable when volume and recency tie', () => {
  const rows = [
    event({ script_id: 'b' }),
    event({ script_id: 'a' }),
    event({ script_id: 'c' }),
  ]

  const first = aggregateDownloadReview(rows).scripts.map((s) => s.script_id)
  const second = aggregateDownloadReview([...rows].reverse()).scripts.map(
    (s) => s.script_id
  )

  assert.deepEqual(first, ['a', 'b', 'c'])
  assert.deepEqual(second, first)
})

test('pages the accounts list without losing the ranking', () => {
  const { accounts } = aggregateDownloadReview([
    event({ user_id: 'a', username: 'a', script_id: 's1' }),
    event({ user_id: 'a', username: 'a', script_id: 's2' }),
    event({ user_id: 'b', username: 'b', script_id: 's1' }),
    event({ user_id: 'c', username: 'c', script_id: 's1' }),
  ])

  const first = pageDownloadReviewAccounts(accounts, accountQuery({ limit: 2 }))
  assert.deepEqual(
    first.items.map((account) => account.profile_id),
    ['a', 'b']
  )
  assert.equal(first.total, 3)

  const second = pageDownloadReviewAccounts(
    accounts,
    accountQuery({ limit: 2, offset: 2 })
  )
  assert.deepEqual(
    second.items.map((account) => account.profile_id),
    ['c']
  )
  assert.equal(second.total, 3)
})

test('sorts the accounts list by a chosen column, both ways', () => {
  const { accounts } = aggregateDownloadReview([
    event({ user_id: 'a', username: 'a', script_id: 's1' }),
    event({ user_id: 'a', username: 'a', script_id: 's2' }),
    event({
      user_id: 'b',
      username: 'b',
      script_id: 's1',
      ip_address: '198.51.100.4',
      device_id: 'device-2',
      created_at: '2026-11-05T10:00:00+00:00',
    }),
  ])

  const byScripts = pageDownloadReviewAccounts(
    accounts,
    accountQuery({ sort: 'scripts' })
  )
  assert.deepEqual(
    byScripts.items.map((account) => account.profile_id),
    ['a', 'b']
  )

  const oldestFirst = pageDownloadReviewAccounts(
    accounts,
    accountQuery({ sort: 'last_download_at', order: 'asc' })
  )
  assert.deepEqual(
    oldestFirst.items.map((account) => account.profile_id),
    ['a', 'b']
  )
})

test('searches both the username and the full name, case-insensitively', () => {
  const { accounts } = aggregateDownloadReview([
    event({ user_id: 'a', username: 'ana', full_name: 'Ana Test' }),
    event({ user_id: 'b', username: 'bojan', full_name: 'Bojan Test' }),
  ])

  const byFullName = pageDownloadReviewAccounts(
    accounts,
    accountQuery({ search: 'ana te' })
  )
  assert.deepEqual(
    byFullName.items.map((account) => account.username),
    ['ana']
  )
  assert.equal(byFullName.total, 1)

  assert.equal(
    pageDownloadReviewAccounts(accounts, accountQuery({ search: 'nobody' }))
      .total,
    0
  )
})

test('searches scripts by title and slug', () => {
  const { scripts } = aggregateDownloadReview([
    event({
      script_id: 'a',
      script_slug: 'biologija-1',
      script_title: 'Biologija',
    }),
    event({
      script_id: 'b',
      script_slug: 'matematika-2',
      script_title: 'Matematika',
    }),
  ])

  assert.deepEqual(
    pageDownloadReviewScripts(
      scripts,
      scriptQuery({ search: 'BIO' })
    ).items.map((script) => script.script_id),
    ['a']
  )
  assert.deepEqual(
    pageDownloadReviewScripts(
      scripts,
      scriptQuery({ search: 'matematika-2' })
    ).items.map((script) => script.script_id),
    ['b']
  )
})
