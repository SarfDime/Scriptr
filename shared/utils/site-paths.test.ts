import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getScriptSitePath,
  getSiteSlugFromHost,
  getSiteSlugFromPath,
  getStudySitePath,
} from './site-paths'

test('a study site path is its handle, and the catalog is the root', () => {
  assert.equal(getStudySitePath('lbe'), '/study/lbe')
  assert.equal(getStudySitePath('drafts.lbe'), '/study/lbe')
  assert.equal(getStudySitePath(null), '/')
  assert.equal(getStudySitePath(''), '/')
})

test('a script page lives under its study site', () => {
  assert.equal(
    getScriptSitePath({ siteSlug: 'lbe', slug: 'biologija-1-ab12cd34' }),
    '/study/lbe/scripts/biologija-1-ab12cd34'
  )
  assert.equal(
    getScriptSitePath({ siteSlug: null, slug: 'biologija-1-ab12cd34' }),
    '/scripts/biologija-1-ab12cd34'
  )
})

test('the study a path belongs to is its first segment after /study', () => {
  assert.equal(getSiteSlugFromPath('/study/lbe'), 'lbe')
  assert.equal(getSiteSlugFromPath('/study/lbe/scripts/x?tab=1'), 'lbe')
  assert.equal(getSiteSlugFromPath('/study/lbe/subject/y'), 'lbe')
  assert.equal(getSiteSlugFromPath('/'), null)
  assert.equal(getSiteSlugFromPath('/user'), null)
  assert.equal(getSiteSlugFromPath('/study'), null)
  assert.equal(getSiteSlugFromPath('/study/'), null)
})

test('the study a host serves is its single label under the catalog host', () => {
  assert.equal(getSiteSlugFromHost('lbe.scriptr.uk', 'scriptr.uk'), 'lbe')
  assert.equal(getSiteSlugFromHost('LBE.scriptr.uk', 'scriptr.uk'), 'lbe')
  assert.equal(
    getSiteSlugFromHost('lbe.localhost:3000', 'localhost:3000'),
    'lbe'
  )
  assert.equal(getSiteSlugFromHost('scriptr.uk', 'scriptr.uk'), null)
  assert.equal(getSiteSlugFromHost('www.scriptr.uk', 'scriptr.uk'), null)
  assert.equal(getSiteSlugFromHost('a.b.scriptr.uk', 'scriptr.uk'), null)
  assert.equal(getSiteSlugFromHost('notthere.example', 'scriptr.uk'), null)
  assert.equal(getSiteSlugFromHost('evilscriptr.uk', 'scriptr.uk'), null)
  assert.equal(getSiteSlugFromHost('', 'scriptr.uk'), null)
  assert.equal(getSiteSlugFromHost('lbe.scriptr.uk', ''), null)
})
