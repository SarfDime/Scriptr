import assert from 'node:assert/strict'
import { afterEach, describe, it, mock } from 'node:test'
import { createLogger } from '../../../shared/utils/logger'

const originalEnv = process.env.NODE_ENV

describe('logger in production', () => {
  afterEach(() => {
    process.env.NODE_ENV = originalEnv
    mock.restoreAll()
  })

  it('emits only errors, including 5xx request lines', () => {
    process.env.NODE_ENV = 'production'
    const out = mock.method(console, 'log', () => undefined)
    const info = mock.method(console, 'info', () => undefined)
    const warn = mock.method(console, 'warn', () => undefined)
    const error = mock.method(console, 'error', () => undefined)
    const { log, logRequest } = createLogger({ identifier: 'TEST' })

    log({ logLevel: 'info', message: 'x' })
    log({ logLevel: 'success', message: 'x' })
    log({ logLevel: 'warn', message: 'x' })
    logRequest({ method: 'GET', path: '/a', status: 200, durationMs: 1 })
    logRequest({ method: 'GET', path: '/a', status: 404, durationMs: 1 })
    assert.equal(out.mock.callCount() + info.mock.callCount(), 0)
    assert.equal(warn.mock.callCount(), 0)

    log({ logLevel: 'error', message: 'x' })
    logRequest({ method: 'GET', path: '/a', status: 500, durationMs: 1 })
    assert.equal(error.mock.callCount(), 2)
  })

  it('logs everything outside production', () => {
    process.env.NODE_ENV = 'development'
    const out = mock.method(console, 'log', () => undefined)
    const { logRequest } = createLogger({ identifier: 'TEST' })
    logRequest({ method: 'GET', path: '/a', status: 200, durationMs: 1 })
    assert.equal(out.mock.callCount(), 1)
  })
})
