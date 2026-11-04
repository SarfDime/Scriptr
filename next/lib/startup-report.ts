import {
  buildEnvReport,
  type EnvVarRequirement,
  summarizeEnvReport,
} from '../../shared/utils/env-report'
import { nextLogs } from './logger'

/**
 * What this app reads, reported once when the dev server or a deployment
 * starts, so a fresh checkout says what is missing. Values are never logged.
 */
const ENV_REQUIREMENTS: Array<EnvVarRequirement> = [
  {
    name: 'NEXT_PUBLIC_API_URL',
    required: true,
    purpose:
      'every API call fails (inlined at build, so redeploy after changing it)',
  },
  {
    name: 'NEXT_PUBLIC_SITE_URL',
    required: true,
    purpose: 'canonicals and /sitemap.xml have no origin',
  },
  {
    name: 'NEXT_PUBLIC_SANITY_PROJECT_ID',
    required: true,
    purpose: 'every Sanity read fails',
  },
  {
    name: 'NEXT_PUBLIC_SANITY_DATASET',
    required: true,
    purpose: 'every Sanity read fails',
  },
  {
    name: 'SANITY_AUTH_TOKEN',
    required: true,
    purpose: 'server-side Sanity reads run unauthenticated',
  },
  {
    name: 'NEXT_PUBLIC_SANITY_STUDIO_URL',
    required: false,
    purpose: 'links into the Studio are missing',
  },
  {
    name: 'NEXT_PUBLIC_SANITY_WEBSITE_ID',
    required: false,
    purpose: 'Sanity website features (visual editing) stay off',
  },
  {
    name: 'NEXT_PUBLIC_ENVIRONMENT_TYPE',
    required: false,
    purpose: 'the app assumes `development`',
  },
  {
    name: 'SITEMAP_SECRET',
    required: false,
    purpose: '/sitemap.xml omits every script URL',
  },
  {
    name: 'REVALIDATE_SECRET',
    required: false,
    purpose: "the API's POST /api/revalidate is rejected",
  },
]

/** Reports the environment once, from `instrumentation.ts` on server start. */
export function reportNextEnvironment(
  env: Record<string, string | undefined> = process.env
): void {
  const summary = summarizeEnvReport(buildEnvReport(ENV_REQUIREMENTS, env), [
    'NEXT_PUBLIC_* values are inlined at build time — restart the dev server or redeploy after changing them',
  ])
  const details = summary.details.map((line) => `  ${line}`).join('\n')

  nextLogs({
    logLevel: summary.isReady ? 'success' : 'error',
    message: `${summary.headline}\n${details}`,
  })
}
