import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { hasUnsupportedScript } from './text-language.utils'

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
