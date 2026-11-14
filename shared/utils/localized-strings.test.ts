import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  DEFAULT_LOCALE,
  ENGLISH_LOCALE,
  type LocaleId,
  MACEDONIAN_LOCALE,
} from '../config/localization-constants'
import {
  firstFilledLocalizedText,
  getMessage,
  getStrings,
  resolveLocalizedText,
  resolveStrings,
} from './localized-strings'

const COLLECTION = {
  notTranslated: 'Plain',
  translated: { en: 'Close', mk: 'Затвори' },
  nested: {
    deeper: { en: 'Language', mk: 'Јазик' },
    untranslated: 'Untouched',
  },
  withCount: (count: number) => ({
    en: `${count} events`,
    mk: `пред ${count} настани`,
  }),
  plainFunction: (name: string) => `Hello ${name}`,
} as const

describe('resolveStrings', () => {
  it('resolves translated entries and leaves untranslated ones alone', () => {
    const strings = resolveStrings(COLLECTION, MACEDONIAN_LOCALE)

    assert.equal(strings.translated, 'Затвори')
    assert.equal(strings.notTranslated, 'Plain')
    assert.equal(strings.nested.deeper, 'Јазик')
    assert.equal(strings.nested.untranslated, 'Untouched')
  })

  it('resolves functions per language, keeping their arguments', () => {
    const strings = resolveStrings(COLLECTION, ENGLISH_LOCALE)

    assert.equal(strings.withCount(3), '3 events')
    assert.equal(strings.plainFunction('Ana'), 'Hello Ana')
  })

  it('falls back to the default language for a missing translation', () => {
    const strings = resolveStrings(
      { incomplete: { en: 'Only English' } },
      MACEDONIAN_LOCALE
    )

    assert.equal(strings.incomplete, 'Only English')
  })

  it('does not treat a non-language object as a translation', () => {
    const strings = resolveStrings({ entry: { count: 1 } }, MACEDONIAN_LOCALE)

    assert.deepEqual(strings.entry, { count: 1 })
  })
})

describe('getStrings', () => {
  it('returns the same object for the same collection and language', () => {
    assert.equal(
      getStrings(COLLECTION, ENGLISH_LOCALE),
      getStrings(COLLECTION, ENGLISH_LOCALE)
    )
  })

  it('separates the languages', () => {
    assert.notEqual(
      getStrings(COLLECTION, ENGLISH_LOCALE),
      getStrings(COLLECTION, MACEDONIAN_LOCALE)
    )
    assert.equal(getStrings(COLLECTION, DEFAULT_LOCALE).translated, 'Close')
  })
})

describe('getMessage', () => {
  const strings = (locale: LocaleId) => getStrings(COLLECTION, locale)

  it('reads a message by dot path', () => {
    assert.equal(
      getMessage(strings(MACEDONIAN_LOCALE), 'nested.deeper'),
      'Јазик'
    )
    assert.equal(getMessage(strings(ENGLISH_LOCALE), 'notTranslated'), 'Plain')
  })

  it('passes arguments to a message function', () => {
    assert.equal(
      getMessage(strings(MACEDONIAN_LOCALE), 'withCount', [4]),
      'пред 4 настани'
    )
  })

  it('returns null for a path that does not end in text', () => {
    assert.equal(getMessage(strings(ENGLISH_LOCALE), 'nested'), null)
    assert.equal(getMessage(strings(ENGLISH_LOCALE), 'nested.missing'), null)
  })
})

describe('resolveLocalizedText', () => {
  it('resolves one entry in the requested language', () => {
    assert.equal(
      resolveLocalizedText({ en: 'Close', mk: 'Затвори' }, MACEDONIAN_LOCALE),
      'Затвори'
    )
    assert.equal(
      resolveLocalizedText({ en: 'Close', mk: 'Затвори' }, ENGLISH_LOCALE),
      'Close'
    )
  })

  it('passes a plain string through unchanged', () => {
    assert.equal(
      resolveLocalizedText('Ss. Cyril and Methodius', MACEDONIAN_LOCALE),
      'Ss. Cyril and Methodius'
    )
  })

  it('falls back to the default language for a missing translation', () => {
    assert.equal(
      resolveLocalizedText({ en: 'Only English' }, MACEDONIAN_LOCALE),
      'Only English'
    )
  })
})

describe('firstFilledLocalizedText', () => {
  it('takes the default language when it is filled', () => {
    assert.equal(
      firstFilledLocalizedText({ en: 'University', mk: 'Универзитет' }),
      'University'
    )
  })

  it('falls to the other language an entry was authored in', () => {
    assert.equal(firstFilledLocalizedText({ mk: 'Универзитет' }), 'Универзитет')
    assert.equal(
      firstFilledLocalizedText({ en: '   ', mk: 'Универзитет' }),
      'Универзитет'
    )
  })

  it('answers an empty string for anything that holds no text', () => {
    assert.equal(firstFilledLocalizedText(undefined), '')
    assert.equal(firstFilledLocalizedText({}), '')
    assert.equal(firstFilledLocalizedText('University'), '')
  })
})
