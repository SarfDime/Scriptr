import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validateSiteSlug } from './api.utils'

test('accepts a plain handle', () => {
  assert.equal(validateSiteSlug('lbe'), null)
})

test('accepts inner dashes and digits', () => {
  assert.equal(validateSiteSlug('cs-masters-2026'), null)
})

test('requires a handle', () => {
  assert.equal(validateSiteSlug(undefined), 'Site slug is required')
  assert.equal(validateSiteSlug(''), 'Site slug is required')
  assert.equal(validateSiteSlug(42), 'Site slug is required')
})

test('caps the handle at 61 characters', () => {
  assert.equal(validateSiteSlug('l'.repeat(61)), null)
  assert.equal(
    validateSiteSlug('l'.repeat(62)),
    'Site slug must be lowercase letters, digits and inner dashes'
  )
})

test('rejects handles the format rules out', () => {
  for (const slug of ['LBE', '-lbe', 'lbe-', 'lb e', 'lbe_1', 'l'.repeat(62)]) {
    assert.equal(
      validateSiteSlug(slug),
      'Site slug must be lowercase letters, digits and inner dashes',
      slug
    )
  }
})

test('rejects reserved handles', () => {
  assert.equal(validateSiteSlug('api'), 'That site slug is reserved')
  assert.equal(
    validateSiteSlug('Files'),
    'Site slug must be lowercase letters, digits and inner dashes'
  )
})
