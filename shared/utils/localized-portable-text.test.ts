import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { PortableTextValue } from '../types/portable-text.types'
import {
  filledTextLanguages,
  isLocalizedScriptDescription,
  isLocalizedScriptTitle,
  localeFallbackOrder,
  localizedPortableTextSearchText,
  pickLocalizedPortableText,
} from './localized-portable-text'

const text = (value: string): PortableTextValue => [
  {
    _type: 'block',
    _key: 'b',
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: 's', text: value, marks: [] }],
  },
]

describe('localeFallbackOrder', () => {
  it('resolves the reader’s language, then the default, then the rest', () => {
    assert.deepEqual(localeFallbackOrder('mk'), ['mk', 'en'])
    assert.deepEqual(localeFallbackOrder('en'), ['en', 'mk'])
  })
})

describe('pickLocalizedPortableText', () => {
  const english = text('English')
  const macedonian = text('Македонски')

  it('renders the reader’s own language', () => {
    assert.equal(
      pickLocalizedPortableText({ en: english, mk: macedonian }, 'mk'),
      macedonian
    )
    assert.equal(
      pickLocalizedPortableText({ en: english, mk: macedonian }, 'en'),
      english
    )
  })

  it('falls back to a language that is filled', () => {
    assert.equal(
      pickLocalizedPortableText({ mk: macedonian }, 'en'),
      macedonian
    )
    assert.equal(pickLocalizedPortableText({ en: english }, 'mk'), english)
  })

  it('treats an empty value as missing', () => {
    assert.equal(
      pickLocalizedPortableText({ en: [], mk: macedonian }, 'en'),
      macedonian
    )
    assert.equal(pickLocalizedPortableText({ en: text('   ') }, 'en'), null)
    assert.equal(pickLocalizedPortableText(null, 'en'), null)
    assert.equal(pickLocalizedPortableText({}, 'en'), null)
  })
})

describe('filledTextLanguages', () => {
  it('lists the languages with text, in the configured order', () => {
    assert.deepEqual(filledTextLanguages({ mk: text('Мк'), en: text('En') }), [
      'en',
      'mk',
    ])
    assert.deepEqual(filledTextLanguages({ mk: text('Мк'), en: [] }), ['mk'])
    assert.deepEqual(filledTextLanguages(null), [])
  })
})

describe('localizedPortableTextSearchText', () => {
  it('flattens every filled language, so a reader finds what they see', () => {
    const searchable = localizedPortableTextSearchText({
      en: text('Cell biology'),
      mk: text('Клеточна биологија'),
    })

    assert.ok(searchable.includes('Cell biology'))
    assert.ok(searchable.includes('Клеточна биологија'))
  })

  it('still finds a script authored in one language only', () => {
    assert.equal(
      localizedPortableTextSearchText({ mk: text('Само македонски') }),
      'Само македонски'
    )
  })
})

describe('isLocalizedScriptTitle', () => {
  it('accepts one filled language, any subset', () => {
    assert.equal(isLocalizedScriptTitle({ mk: text('Наслов') }), true)
    assert.equal(
      isLocalizedScriptTitle({ en: text('Title'), mk: text('Наслов') }),
      true
    )
  })

  it('rejects the pre-localization shape and objects with nothing filled', () => {
    assert.equal(isLocalizedScriptTitle(text('Title')), false)
    assert.equal(isLocalizedScriptTitle({}), false)
    assert.equal(isLocalizedScriptTitle({ en: [] }), false)
    assert.equal(isLocalizedScriptTitle({ en: text('  ') }), false)
    assert.equal(isLocalizedScriptTitle(null), false)
  })

  it('rejects an unknown language key and an oversized entry', () => {
    assert.equal(isLocalizedScriptTitle({ de: text('Titel') }), false)
    assert.equal(isLocalizedScriptTitle({ en: text('x'.repeat(4_000)) }), false)
  })
})

describe('isLocalizedScriptDescription', () => {
  it('accepts a filled description and rejects an empty one', () => {
    assert.equal(isLocalizedScriptDescription({ en: text('Body') }), true)
    assert.equal(isLocalizedScriptDescription({ en: [] }), false)
    assert.equal(isLocalizedScriptDescription(text('Body')), false)
  })
})
