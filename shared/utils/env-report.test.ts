import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildEnvReport,
  type EnvVarRequirement,
  summarizeEnvReport,
} from './env-report'

const REQUIREMENTS: Array<EnvVarRequirement> = [
  { name: 'API_URL', required: true, purpose: 'every request fails' },
  { name: 'TOKEN_SECRET', required: true, purpose: 'writes fail closed' },
  {
    name: 'SITEMAP_SECRET',
    required: false,
    purpose: 'the sitemap drops files',
  },
]

test('separates missing required from missing optional', () => {
  const report = buildEnvReport(REQUIREMENTS, { API_URL: 'set' })

  assert.equal(report.isReady, false)
  assert.deepEqual(
    report.missingRequired.map((entry) => entry.name),
    ['TOKEN_SECRET']
  )
  assert.deepEqual(
    report.missingOptional.map((entry) => entry.name),
    ['SITEMAP_SECRET']
  )
  assert.deepEqual(
    report.set.map((entry) => entry.name),
    ['API_URL']
  )
})

test('treats blank and whitespace values as unset', () => {
  const report = buildEnvReport(REQUIREMENTS, {
    API_URL: '   ',
    TOKEN_SECRET: '',
    SITEMAP_SECRET: 'x',
  })

  assert.deepEqual(
    report.missingRequired.map((entry) => entry.name),
    ['API_URL', 'TOKEN_SECRET']
  )
  assert.equal(report.isReady, false)
})

test('reports readiness once every required variable is set', () => {
  const report = buildEnvReport(REQUIREMENTS, {
    API_URL: 'set',
    TOKEN_SECRET: 'set',
  })

  assert.equal(report.isReady, true)
  assert.equal(report.missingRequired.length, 0)
})

test('never prints values, only names and purposes', () => {
  const secret = 'super-secret-value'
  const summary = summarizeEnvReport(
    buildEnvReport(REQUIREMENTS, {
      API_URL: secret,
      SITEMAP_SECRET: secret,
    }),
    ['DEPRECATED is still set — remove it']
  )

  assert.doesNotMatch(summary.headline, /super-secret/)
  assert.doesNotMatch(summary.details.join('\n'), /super-secret/)
  const details = summary.details.join('\n')
  assert.match(details, /API_URL/)
  assert.match(details, /TOKEN_SECRET\s+writes fail closed/)
  assert.match(details, /DEPRECATED is still set/)
})

test('lists one variable per line, under grouped headings', () => {
  const summary = summarizeEnvReport(
    buildEnvReport(REQUIREMENTS, { API_URL: 'set', SITEMAP_SECRET: 'set' }),
    ['a note']
  )

  assert.deepEqual(summary.details, [
    'missing, required (1):',
    '  TOKEN_SECRET  writes fail closed',
    'notes:',
    '  a note',
    'set (2):',
    '  API_URL',
    '  SITEMAP_SECRET',
  ])
})

test('leaves out groups that have no entries', () => {
  const summary = summarizeEnvReport(
    buildEnvReport(REQUIREMENTS, {
      API_URL: 'x',
      TOKEN_SECRET: 'y',
      SITEMAP_SECRET: 'z',
    })
  )

  assert.deepEqual(summary.details, [
    'set (3):',
    '  API_URL',
    '  TOKEN_SECRET',
    '  SITEMAP_SECRET',
  ])
})

test('headlines read correctly in both states', () => {
  const ready = summarizeEnvReport(
    buildEnvReport(REQUIREMENTS, { API_URL: 'x', TOKEN_SECRET: 'y' })
  )
  assert.match(
    ready.headline,
    /^Environment ready — 2 variables set, 1 optional variable not set\.$/
  )

  const missing = summarizeEnvReport(
    buildEnvReport(REQUIREMENTS, { API_URL: 'x' })
  )
  assert.equal(
    missing.headline,
    'Environment incomplete — 1 required variable missing.'
  )
})
