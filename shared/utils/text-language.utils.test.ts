import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  countLetters,
  hasUnsupportedScript,
  hasWrongScriptForLocale,
} from './text-language.utils'

describe('hasUnsupportedScript', () => {
  it('accepts Latin', () => {
    assert.equal(hasUnsupportedScript('Mobile phones 2026'), false)
    assert.equal(hasUnsupportedScript('Ščedrvaj Čedo Žarko'), false)
  })

  it('accepts Macedonian Cyrillic', () => {
    assert.equal(hasUnsupportedScript('биологија предавање 1'), false)
    assert.equal(hasUnsupportedScript('Ѓорѓи Ќосев'), false)
    assert.equal(hasUnsupportedScript('Привет мир'), false)
  })

  it('rejects Greek', () => {
    assert.equal(hasUnsupportedScript('Βιολογία'), true)
  })

  it('rejects CJK', () => {
    assert.equal(hasUnsupportedScript('中文标题'), true)
  })

  it('rejects Arabic and Hebrew', () => {
    assert.equal(hasUnsupportedScript('مرحبا'), true)
    assert.equal(hasUnsupportedScript('שלום'), true)
  })

  it('ignores digits, punctuation and emoji', () => {
    assert.equal(hasUnsupportedScript('2026 — 50% (дел 2) 🎓'), false)
    assert.equal(hasUnsupportedScript(''), false)
  })

  it('catches one foreign word inside a Latin title', () => {
    assert.equal(hasUnsupportedScript('Chemistry β test'), true)
  })
})

describe('hasWrongScriptForLocale', () => {
  it('accepts each language in its own script', () => {
    assert.equal(hasWrongScriptForLocale('Biology notes', 'en'), false)
    assert.equal(hasWrongScriptForLocale('Белешки по биологија', 'mk'), false)
  })

  it('rejects Cyrillic in English fields', () => {
    assert.equal(hasWrongScriptForLocale('Биологија', 'en'), true)
    assert.equal(hasWrongScriptForLocale('Biology Биологија', 'en'), true)
  })

  it('rejects Latin in Macedonian fields', () => {
    assert.equal(hasWrongScriptForLocale('Biology', 'mk'), true)
    assert.equal(hasWrongScriptForLocale('Биологија Biology', 'mk'), true)
  })

  it('ignores digits, punctuation and emoji', () => {
    assert.equal(hasWrongScriptForLocale('2026 — 50% (дел 2) 🎓', 'mk'), false)
    assert.equal(hasWrongScriptForLocale('', 'en'), false)
  })
})

describe('countLetters', () => {
  it('counts letters in either script', () => {
    assert.equal(countLetters('Биологија'), 9)
    assert.equal(countLetters('Biology'), 7)
  })

  it('ignores digits, punctuation, spaces and emoji', () => {
    assert.equal(countLetters('2026 — 50% (дел 2) 🎓'), 3)
    assert.equal(countLetters('   '), 0)
  })
})
