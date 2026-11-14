import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  DEFAULT_LOCALE,
  ENGLISH_LOCALE,
  MACEDONIAN_LOCALE,
} from '../config/localization-constants'
import { localizedPath, unprefixedPath } from './localized-path'

describe('localizedPath', () => {
  it('leaves the default language untouched', () => {
    assert.equal(
      localizedPath('/university/ukim', DEFAULT_LOCALE),
      '/university/ukim'
    )
    assert.equal(localizedPath('/', ENGLISH_LOCALE), '/')
    assert.equal(
      localizedPath('https://lbe.scriptr.uk/scripts/x', ENGLISH_LOCALE),
      'https://lbe.scriptr.uk/scripts/x'
    )
  })

  it('prefixes a translated path', () => {
    assert.equal(localizedPath('/', MACEDONIAN_LOCALE), '/mk')
    assert.equal(
      localizedPath('/university/ukim', MACEDONIAN_LOCALE),
      '/mk/university/ukim'
    )
  })

  it('keeps the query string and the hash', () => {
    assert.equal(
      localizedPath(
        '/study/lbe/calendar?view=week&date=2026-11-14',
        MACEDONIAN_LOCALE
      ),
      '/mk/study/lbe/calendar?view=week&date=2026-11-14'
    )
    assert.equal(
      localizedPath('/university/ukim#faculties', MACEDONIAN_LOCALE),
      '/mk/university/ukim#faculties'
    )
  })

  it('prefixes the path of an absolute URL and keeps the rest', () => {
    assert.equal(
      localizedPath('https://lbe.scriptr.uk', MACEDONIAN_LOCALE),
      'https://lbe.scriptr.uk/mk'
    )
    assert.equal(
      localizedPath(
        'https://lbe.scriptr.uk/scripts/x?tab=files',
        MACEDONIAN_LOCALE
      ),
      'https://lbe.scriptr.uk/mk/scripts/x?tab=files'
    )
  })

  it('is idempotent', () => {
    assert.equal(
      localizedPath('/mk/university', MACEDONIAN_LOCALE),
      '/mk/university'
    )
    assert.equal(
      localizedPath('https://lbe.scriptr.uk/mk', MACEDONIAN_LOCALE),
      'https://lbe.scriptr.uk/mk'
    )
  })

  it('does not invent a prefix for something that is not a path', () => {
    assert.equal(
      localizedPath('mailto:a@b.c', MACEDONIAN_LOCALE),
      'mailto:a@b.c'
    )
    assert.equal(localizedPath('', MACEDONIAN_LOCALE), '')
  })
})

describe('unprefixedPath', () => {
  it('removes a non-default prefix and leaves the default alone', () => {
    assert.equal(unprefixedPath('/mk/university'), '/university')
    assert.equal(unprefixedPath('/mk'), '/')
    assert.equal(unprefixedPath('/university'), '/university')
    assert.equal(unprefixedPath('/'), '/')
  })

  it('keeps the query string and the hash', () => {
    assert.equal(
      unprefixedPath('/mk/study/lbe/calendar?view=week#today'),
      '/study/lbe/calendar?view=week#today'
    )
  })

  it('handles an absolute study URL', () => {
    assert.equal(
      unprefixedPath('https://lbe.scriptr.uk/mk/scripts/x'),
      'https://lbe.scriptr.uk/scripts/x'
    )
    assert.equal(
      unprefixedPath('https://lbe.scriptr.uk/mk'),
      'https://lbe.scriptr.uk/'
    )
  })

  it('is the inverse of localizedPath for both languages', () => {
    const locales: Array<'en' | 'mk'> = [ENGLISH_LOCALE, MACEDONIAN_LOCALE]
    for (const locale of locales) {
      assert.equal(
        unprefixedPath(localizedPath('/university/ukim', locale)),
        '/university/ukim'
      )
    }
  })
})

describe('unprefixedPath with the default prefix', () => {
  it('strips `/en`, which only a rewritten pathname carries', () => {
    assert.equal(unprefixedPath('/en'), '/')
    assert.equal(unprefixedPath('/en/university/ukim'), '/university/ukim')
    assert.equal(
      unprefixedPath('https://lbe.scriptr.uk/en/scripts?x=1'),
      'https://lbe.scriptr.uk/scripts?x=1'
    )
  })
})
