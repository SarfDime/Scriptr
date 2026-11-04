import {
  buildEnvReport,
  type EnvVarRequirement,
  summarizeEnvReport,
} from '../../shared/utils/env-report.ts'

/**
 * What the Studio reads, reported by `scripts/check-env.ts` before `sanity dev`
 * and `sanity build` (the Studio CLI never evaluates this project's config in
 * Node, so a config-time log would never print). Values are never printed.
 *
 * Everything here is bundled into the browser app, so the report also flags any
 * `SANITY_STUDIO_*` name that looks like a credential: those are not settings,
 * they are the exact leak this Studio no longer relies on.
 */
const ENV_REQUIREMENTS: Array<EnvVarRequirement> = [
  {
    name: 'SANITY_STUDIO_API_URL',
    required: false,
    purpose:
      'the Studio calls http://localhost:8787, which is wrong for anything but local dev',
  },
  {
    name: 'SANITY_STUDIO_PREVIEW_ORIGIN',
    required: false,
    purpose: 'preview links fall back to http://localhost:3000',
  },
]

const SECRET_LIKE = /(SECRET|TOKEN|PASSWORD|PRIVATE|KEY)/

export function reportStudioEnvironment(
  env: Record<string, string | undefined> = process.env
): void {
  const bundledSecrets = Object.keys(env).filter(
    (name) => name.startsWith('SANITY_STUDIO_') && SECRET_LIKE.test(name)
  )

  const notes = [
    'no secret belongs here: sync actions ask for a TOTP code and exchange it for a ten-minute token',
  ]

  if (bundledSecrets.length > 0) {
    notes.push(
      `looks like a credential but is compiled into the public Studio bundle: ${bundledSecrets.join(', ')}`
    )
  }

  if (
    env.NODE_ENV === 'production' &&
    (env.SANITY_STUDIO_API_URL ?? '').trim().startsWith('http://')
  ) {
    notes.push(
      'SANITY_STUDIO_API_URL is plain http in a production build — it should be https'
    )
  }

  const summary = summarizeEnvReport(
    buildEnvReport(ENV_REQUIREMENTS, env),
    notes
  )
  const details = summary.details.map((line) => `  ${line}`).join('\n')

  // `console` is captured by the Studio CLI while it evaluates this config, so
  // the report goes to the stream directly.
  process.stdout.write(
    `[STUDIO]${summary.isReady ? 'INFO' : 'ERROR'}:  ${summary.headline}\n${details}\n`
  )
}
