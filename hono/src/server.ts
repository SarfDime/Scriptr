import { serve } from '@hono/node-server'
import {
  buildEnvReport,
  type EnvVarRequirement,
  summarizeEnvReport,
} from '../../shared/utils/env-report'
import { app } from './index'
import { decodeBase32 } from './lib/admin-access'
import { honoLog } from './lib/logger'

/**
 * What this API reads, so a fresh checkout says what is missing instead of
 * failing with a 500 on the first request. Values are never logged.
 */
const ENV_REQUIREMENTS: Array<EnvVarRequirement> = [
  {
    name: 'SUPABASE_URL',
    required: true,
    purpose: 'no database client can be created',
  },
  {
    name: 'SUPABASE_PUBLISHABLE_KEY',
    required: true,
    purpose: 'no database client can be created',
  },
  {
    name: 'SUPABASE_SECRET_KEY',
    required: true,
    purpose: 'catalog writes and every service-role route fail',
  },
  {
    name: 'R2_ACCOUNT_ID',
    required: true,
    purpose: 'uploads cannot reach storage',
  },
  {
    name: 'R2_ACCESS_KEY_ID',
    required: true,
    purpose: 'uploads cannot reach storage',
  },
  {
    name: 'R2_SECRET_ACCESS_KEY',
    required: true,
    purpose: 'uploads cannot reach storage',
  },
  {
    name: 'R2_ENDPOINT',
    required: true,
    purpose: 'uploads cannot reach storage',
  },
  {
    name: 'R2_BUCKET',
    required: true,
    purpose: 'uploads have no default bucket',
  },
  {
    name: 'R2_PUBLIC_URL',
    required: true,
    purpose: 'avatar and public file URLs answer 503',
  },
  {
    name: 'ADMIN_TOTP_SECRET',
    required: true,
    purpose:
      'Studio sync/delete and the site admin unlock answer 401 (generate one with `pnpm admin:totp`)',
  },
  {
    name: 'SANITY_STUDIO_ORIGIN',
    required: true,
    purpose: '/api/sanity answers 403 to the Studio',
  },
  {
    name: 'WEBSITE_ORIGIN',
    required: true,
    purpose: '/api/admin and the admin routes answer 403 to the site',
  },
  {
    name: 'CORS_ORIGINS',
    required: false,
    purpose: 'only the localhost dev ports are allowed (outside production)',
  },
  {
    name: 'SITEMAP_SECRET',
    required: false,
    purpose: '/sitemap.xml omits every script URL',
  },
  {
    name: 'COOKIE_DOMAIN',
    required: false,
    purpose:
      'session cookies are host-scoped instead of shared across the site',
  },
  {
    name: 'NEXT_REVALIDATE_URL',
    required: false,
    purpose: 'mutations leave the web cache stale until the next build',
  },
  {
    name: 'REVALIDATE_SECRET',
    required: false,
    purpose: 'POST /api/revalidate rejects the web app',
  },
  {
    name: 'VERCEL_AUTOMATION_BYPASS_SECRET',
    required: false,
    purpose:
      'revalidation is answered 401 by Vercel Authentication when the web URL is a deployment alias',
  },
  {
    name: 'OPTIMIZER_URL',
    required: false,
    purpose: '/file-ops/finalize uses the in-process stand-in',
  },
  {
    name: 'OPTIMIZER_SECRET',
    required: false,
    purpose: '/file-ops/finalize cannot sign optimizer requests',
  },
]

/** Problems the checklist cannot see: a malformed secret, a leftover variable. */
function collectNotes(env: Record<string, string | undefined>): Array<string> {
  const notes: Array<string> = []

  const totpSecret = (env.ADMIN_TOTP_SECRET ?? '').trim()
  if (totpSecret) {
    try {
      decodeBase32(totpSecret)
    } catch {
      notes.push(
        'ADMIN_TOTP_SECRET is not valid base32 — both access surfaces answer 503 until it is fixed'
      )
    }
  }

  if ((env.INTERNAL_API_SECRET ?? '').trim()) {
    notes.push(
      'INTERNAL_API_SECRET is still set but nothing reads it — remove it (its value was exposed in the old Studio bundle)'
    )
  }

  // Only called out in production: the placeholders are correct in a dev .env.
  if (env.NODE_ENV === 'production') {
    const placeholders: Record<string, string> = {
      REVALIDATE_SECRET: 'development_secret_key',
      OPTIMIZER_SECRET: 'development_secret_key',
      SITEMAP_SECRET: 'development_sitemap_secret',
    }
    const reused = Object.entries(placeholders)
      .filter(([name, example]) => (env[name] ?? '').trim() === example)
      .map(([name]) => name)

    if (reused.length > 0) {
      notes.push(
        `still using the .env.example value, so anyone with the repository holds it: ${reused.join(', ')} — rotate to a unique random value on both sides`
      )
    }
  }

  return notes
}

function logEnvironment() {
  const summary = summarizeEnvReport(
    buildEnvReport(ENV_REQUIREMENTS),
    collectNotes(process.env)
  )
  const details = summary.details.map((line) => `  ${line}`).join('\n')

  honoLog({
    logLevel: summary.isReady ? 'success' : 'error',
    message: `${summary.headline}\n${details}`,
  })
}

const port = Number(process.env.PORT) || 8787
const env = process.env.NODE_ENV || 'development'

logEnvironment()

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    honoLog({
      logLevel: 'success',
      message: `Faculty Scripts API started on http://localhost:${info.port} [${env}]`,
    })
  }
)
