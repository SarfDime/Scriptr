import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ADMIN_PROFILES_MAX_PAGE_SIZE,
  ADMIN_PROFILES_PAGE_SIZE,
} from '../../../shared/config/shared-constants'
import {
  parseAdminProfilesQuery,
  toAdminProfileSearchPattern,
} from './admin-profiles-query'

/** Builds the `get` the route passes in, from a plain object. */
const fromQuery =
  (query: Record<string, string> = {}) =>
  (name: string) =>
    query[name]

test('defaults to the newest first page and no filters', () => {
  assert.deepEqual(parseAdminProfilesQuery(fromQuery()), {
    limit: ADMIN_PROFILES_PAGE_SIZE,
    offset: 0,
    role: null,
    searchPattern: null,
    sort: 'created_at',
    order: 'desc',
  })
})

test('reads a page, a role, a sort column and a direction', () => {
  assert.deepEqual(
    parseAdminProfilesQuery(
      fromQuery({
        limit: '50',
        offset: '100',
        role: 'owner',
        sort: 'username',
        order: 'asc',
      })
    ),
    {
      limit: 50,
      offset: 100,
      role: 'owner',
      searchPattern: null,
      sort: 'username',
      order: 'asc',
    }
  )
})

test('rejects paging outside the endpoint limits', () => {
  const invalidRequests: Array<Record<string, string>> = [
    { limit: '0' },
    { limit: '-1' },
    { limit: String(ADMIN_PROFILES_MAX_PAGE_SIZE + 1) },
    { limit: '1.5' },
    { limit: 'ten' },
    { offset: '-1' },
    { offset: '2.5' },
    { offset: 'later' },
  ]

  for (const query of invalidRequests) {
    assert.equal(
      parseAdminProfilesQuery(fromQuery(query)),
      null,
      JSON.stringify(query)
    )
  }
})

test('rejects an unknown role, sort column or direction', () => {
  // The old platform roles are study-level now, so they are not valid here.
  assert.equal(parseAdminProfilesQuery(fromQuery({ role: 'admin' })), null)
  assert.equal(parseAdminProfilesQuery(fromQuery({ role: 'moderator' })), null)
  assert.equal(parseAdminProfilesQuery(fromQuery({ sort: 'email' })), null)
  assert.equal(parseAdminProfilesQuery(fromQuery({ order: 'up' })), null)
})

test('wraps a search term in wildcards', () => {
  assert.equal(toAdminProfileSearchPattern('ana'), '%ana%')
  assert.equal(toAdminProfileSearchPattern('  ana  '), '%ana%')
  assert.equal(toAdminProfileSearchPattern('ана'), '%ана%')
})

test('strips the characters a PostgREST or-filter reserves', () => {
  // Each reserved character becomes a space; the pattern grammar then has
  // nothing left to parse as syntax.
  assert.equal(
    toAdminProfileSearchPattern('a,b(c)"d\\e%f_g'),
    '%a b c  d e f g%'
  )
  assert.equal(toAdminProfileSearchPattern(','), null)
  assert.equal(toAdminProfileSearchPattern('   '), null)
  assert.equal(toAdminProfileSearchPattern('%%'), null)
})

test('a punctuated search term never reaches the filter grammar', () => {
  const parsed = parseAdminProfilesQuery(
    fromQuery({ search: 'x,y) or (username.eq.admin' })
  )
  assert.equal(parsed?.searchPattern, '%x y  or  username.eq.admin%')
  assert.doesNotMatch(parsed?.searchPattern ?? '', /[(),"]/)
})
