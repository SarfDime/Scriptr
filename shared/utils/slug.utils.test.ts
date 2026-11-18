import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildScriptSlug,
  SLUG_ID_LENGTH,
  SLUG_STEM_MAX_LENGTH,
  slugifyTitle,
  transliterateToAscii,
} from './slug.utils'

describe('transliterateToAscii', () => {
  it('folds Macedonian Cyrillic', () => {
    assert.equal(transliterateToAscii('биологија'), 'biologija')
  })

  it('folds the letters that have no single Latin equivalent', () => {
    assert.equal(transliterateToAscii('Ѓорѓи Ќосев'), 'gjorgji kjosev')
    assert.equal(
      transliterateToAscii('Ѕвезда Џон Љупчо Његош'),
      'dzvezda dzon ljupco njegos'
    )
  })

  it('folds accented Latin', () => {
    assert.equal(
      transliterateToAscii('Ščedrvaj Čedo Žarko'),
      'scedrvaj cedo zarko'
    )
  })

  it('handles the one Latin letter NFKD leaves alone', () => {
    assert.equal(transliterateToAscii('Đorđe'), 'djordje')
  })
})

describe('slugifyTitle', () => {
  it('builds a readable slug from a Cyrillic title', () => {
    assert.equal(
      slugifyTitle('биологија предавање 1'),
      'biologija-predavanje-1'
    )
  })

  it('collapses punctuation and spacing into single dashes', () => {
    assert.equal(slugifyTitle('Test  --  script!! 2026.'), 'test-script-2026')
  })

  it('keeps digits and mixed scripts', () => {
    assert.equal(slugifyTitle('Хемија 2 дел'), 'hemija-2-del')
  })

  it('returns an empty string when nothing survives', () => {
    assert.equal(slugifyTitle('— !!! —'), '')
    assert.equal(slugifyTitle(''), '')
  })

  it('caps the length without leaving a trailing dash', () => {
    const slug = slugifyTitle(`${'дугачко '.repeat(20)}крај`)

    assert.ok(slug.length <= SLUG_STEM_MAX_LENGTH)
    assert.ok(!slug.endsWith('-'))
  })
})

describe('buildScriptSlug', () => {
  const id = 'f585a670-a2e7-4c11-8591-9e81bdcd5058'

  it('appends the leading id characters, without their dashes', () => {
    assert.equal(
      buildScriptSlug('биологија предавање 1', id),
      'biologija-predavanje-1-f585a670'
    )
  })

  it('takes exactly SLUG_ID_LENGTH characters', () => {
    const suffix = buildScriptSlug('test', id).split('-').at(-1)

    assert.equal(suffix?.length, SLUG_ID_LENGTH)
  })

  it('falls back to "script" when the title has nothing usable', () => {
    assert.equal(buildScriptSlug('— !!! —', id), 'script-f585a670')
  })

  it('is stable for the same title and id', () => {
    assert.equal(buildScriptSlug('Наслов', id), buildScriptSlug('Наслов', id))
  })

  it('differs for two scripts with the same title', () => {
    assert.notEqual(
      buildScriptSlug('Наслов', id),
      buildScriptSlug('Наслов', '0b0b0b0b-0000-0000-0000-000000000000')
    )
  })
})
