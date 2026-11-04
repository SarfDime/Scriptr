import { S3Client } from '@aws-sdk/client-s3'
import { serve } from '@hono/node-server'
import {
  buildEnvReport,
  type EnvVarRequirement,
  summarizeEnvReport,
} from '../../shared/utils/env-report'
import { createApp } from './app'
import { createConcurrencyLimiter } from './limiter'
import { createOptimizers } from './optimizers'
import { createOptimizeFile } from './pipeline'
import { createR2Storage } from './storage'

const requireEnv = (name: string): string => {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required`)
  return value
}

/** Reported before the checks below throw, so a cold start lists everything
 * that is missing rather than only the first variable. Values are never shown. */
const ENV_REQUIREMENTS: Array<EnvVarRequirement> = [
  {
    name: 'R2_ENDPOINT',
    required: true,
    purpose: 'the service cannot reach storage and refuses to start',
  },
  {
    name: 'R2_ACCESS_KEY_ID',
    required: true,
    purpose: 'the service cannot reach storage and refuses to start',
  },
  {
    name: 'R2_SECRET_ACCESS_KEY',
    required: true,
    purpose: 'the service cannot reach storage and refuses to start',
  },
  {
    name: 'OPTIMIZER_SECRET',
    required: true,
    purpose: 'the API cannot sign requests and every call is rejected',
  },
  {
    name: 'OPTIMIZER_MAX_CONCURRENCY',
    required: false,
    purpose: 'concurrency falls back to 2',
  },
  { name: 'PORT', required: false, purpose: 'listens on 8788' },
]

function logEnvironment() {
  const summary = summarizeEnvReport(buildEnvReport(ENV_REQUIREMENTS))
  const details = summary.details.map((line) => `  ${line}`).join('\n')

  process.stdout.write(
    `[OPTIMIZER]${summary.isReady ? 'INFO' : 'ERROR'}:  ${summary.headline}\n${details}\n`
  )
}

logEnvironment()

// The same R2 variables the API uses, but the token should be this service's own.
const storage = createR2Storage(
  new S3Client({
    region: 'auto',
    endpoint: requireEnv('R2_ENDPOINT'),
    credentials: {
      accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
    },
  })
)

const optimizeFile = createOptimizeFile({
  storage,
  optimizers: createOptimizers(),
})
const limit = createConcurrencyLimiter(
  Number(process.env.OPTIMIZER_MAX_CONCURRENCY) || 2
)

const app = createApp({
  secret: requireEnv('OPTIMIZER_SECRET'),
  optimize: (request, deadline) => limit(() => optimizeFile(request, deadline)),
})

// Cloud Run supplies PORT.
const port = Number(process.env.PORT) || 8788

serve({ fetch: app.fetch, port }, (info) => {
  process.stdout.write(`Optimizer listening on http://localhost:${info.port}\n`)
})
