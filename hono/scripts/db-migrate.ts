/** biome-ignore-all lint/suspicious/noConsole: a CLI script reports its progress on the terminal. */

/**
 * Applies pending Supabase migrations with the safety checks `db push` doesn't
 * do for you, then regenerates the Supabase types.
 *
 * Dry run by default: it only reports what would be applied. Nothing reaches
 * the database without `--apply`.
 *
 *   corepack pnpm db:migrate                  # analyse + preview
 *   corepack pnpm db:migrate --apply          # push, then regenerate types
 *   corepack pnpm db:migrate --apply --skip-types
 *
 * Refused (rather than pushed):
 *   - no linked project (`supabase link` first)
 *   - remote-only migrations, i.e. local history no longer matches the remote
 *   - pending migration files with uncommitted edits (`--allow-uncommitted`)
 *   - destructive statements in a pending file (`--allow-destructive`)
 *   - a dirty generated-types file after the run
 */

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import {
  REVALIDATE_SIGNATURE_HEADER,
  REVALIDATE_TIMESTAMP_HEADER,
} from '../../shared/config/access'
import { PROFILE_CACHE_TAGS } from '../../shared/config/cache-tags'
import { signRequest } from '../../shared/utils/request-signature'

const HONO_DIR = path.resolve(import.meta.dirname, '..')
const REPO_DIR = path.resolve(HONO_DIR, '..')
const SUPABASE_DIR = path.join(HONO_DIR, 'supabase')
const MIGRATIONS_DIR = path.join(SUPABASE_DIR, 'migrations')
const TYPES_FILE = path.join(REPO_DIR, 'shared/types/database.types.ts')
const SUPABASE_BIN = path.join(HONO_DIR, 'node_modules/.bin/supabase')

const flags = new Set(process.argv.slice(2))
const apply = flags.has('--apply')
const skipTypes = flags.has('--skip-types')
const allowUncommitted = flags.has('--allow-uncommitted')
const allowDestructive = flags.has('--allow-destructive')

type MigrationRow = { local?: string | null; remote?: string | null }

const fail = (message: string): never => {
  console.error(`\n✖ ${message}\n`)
  process.exit(1)
}

const section = (message: string) => console.log(`\n${message}`)

/** Runs the Supabase CLI in the `hono` workspace, where it is installed. */
const supabase = (args: Array<string>) =>
  spawnSync(SUPABASE_BIN, args, {
    cwd: HONO_DIR,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })

/** Supabase prints "a new version is available" to stderr; stdout is JSON. */
const parseJson = <T>(output: string, what: string): T => {
  const start = output.indexOf('{')
  const end = output.lastIndexOf('}')
  if (start === -1 || end === -1) fail(`Could not read ${what} output`)
  try {
    return JSON.parse(output.slice(start, end + 1)) as T
  } catch {
    return fail(`Could not parse ${what} output`)
  }
}

const git = (args: Array<string>) =>
  spawnSync('git', args, {
    cwd: REPO_DIR,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })

const readLinkedProject = () => {
  const file = path.join(SUPABASE_DIR, '.temp/project-ref')
  if (!fs.existsSync(file)) {
    fail(
      'No linked Supabase project. Run `cd hono && npx supabase link --project-ref <ref>` first.'
    )
  }
  const ref = fs.readFileSync(file, 'utf8').trim()
  if (!ref) fail('The linked project file is empty; link the project again.')
  return ref
}

/** Migration files on disk. The version is the timestamp prefix, which is what
 * the remote history records; the rest of the name is only descriptive. */
const readLocalMigrations = () =>
  fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith('.sql'))
    .map((name) => ({ version: name.split('_')[0] ?? name, name }))
    .sort((a, b) => a.version.localeCompare(b.version))

/** File names of the migrations the remote history does not have yet. */
const findPending = (
  rows: Array<MigrationRow>,
  local: Array<{ version: string; name: string }>
) => {
  // The remote history records bare versions; match them against the files so
  // everything reported here is a name that exists on disk.
  const recorded = new Set(
    rows.flatMap((row) => (row.remote ? [row.remote] : []))
  )
  return local
    .filter((migration) => !recorded.has(migration.version))
    .map((migration) => migration.name)
}

const DESTRUCTIVE_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: 'DROP TABLE', pattern: /\bdrop\s+table\b/i },
  { label: 'DROP COLUMN', pattern: /\bdrop\s+column\b/i },
  { label: 'TRUNCATE', pattern: /\btruncate\b/i },
  { label: 'DROP SCHEMA', pattern: /\bdrop\s+schema\b/i },
  {
    label: 'ALTER COLUMN TYPE',
    pattern: /\balter\s+column\b[\s\S]*?\btype\b/i,
  },
  { label: 'DELETE without WHERE', pattern: /^\s*delete\s+from\s+.+;?\s*$/im },
]

const scanDestructive = (names: Array<string>) =>
  names.flatMap((name) => {
    const file = path.join(MIGRATIONS_DIR, name)
    return fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .flatMap((text, index) => {
        const code = text.replace(/--.*$/, '')
        if (!code.trim()) return []
        const hit = DESTRUCTIVE_PATTERNS.find(({ pattern }) =>
          pattern.test(code)
        )
        return hit
          ? [
              {
                file: name,
                line: index + 1,
                label: hit.label,
                text,
              },
            ]
          : []
      })
  })

/** A pending migration that only exists in the working tree would be applied
 * to the remote while absent from the repository. */
const findUncommitted = (names: Array<string>) => {
  const paths = names.map((name) =>
    path.relative(REPO_DIR, path.join(MIGRATIONS_DIR, name))
  )
  const status = git(['status', '--porcelain', '--', ...paths])
  if (status.status !== 0) return []
  return status.stdout
    .split('\n')
    .map((line) => line.slice(3).trim())
    .filter(Boolean)
}

/**
 * A migration can change data that cached public pages already embedded (an
 * achievement's title, for instance), and `db push` knows nothing about the
 * web cache. Best effort: a failure here is reported, not fatal.
 */
const revalidatePublicPages = async () => {
  section('◇ Revalidating cached public pages')
  try {
    process.loadEnvFile(path.join(HONO_DIR, '.env'))
  } catch {
    console.log('  Skipped: no hono/.env to read the revalidate settings from.')
    return
  }

  const url = process.env.NEXT_REVALIDATE_URL
  const secret = process.env.REVALIDATE_SECRET
  if (!url || !secret) {
    console.log(
      '  Skipped: NEXT_REVALIDATE_URL and REVALIDATE_SECRET are unset.'
    )
    return
  }

  const body = JSON.stringify({ tags: [PROFILE_CACHE_TAGS.public()] })
  const timestamp = String(Date.now())
  const signature = await signRequest(secret, timestamp, body)

  const result = spawnSync(
    'curl',
    [
      '-sS',
      '-X',
      'POST',
      url,
      '-H',
      'content-type: application/json',
      '-H',
      `${REVALIDATE_TIMESTAMP_HEADER}: ${timestamp}`,
      '-H',
      `${REVALIDATE_SIGNATURE_HEADER}: ${signature}`,
      '-d',
      body,
    ],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
  )

  if (result.status === 0) console.log(`  ${result.stdout.trim()}`)
  else console.log(`  Failed: ${result.stderr.trim() || 'no response'}`)
}

const runOrFail = (args: Array<string>, what: string) => {
  const result = spawnSync(SUPABASE_BIN, args, {
    cwd: HONO_DIR,
    stdio: 'inherit',
  })
  if (result.status !== 0) fail(`${what} failed`)
}

const regenerateTypes = (ref: string) => {
  section('◇ Regenerating Supabase types')
  const result = spawnSync(
    'corepack',
    ['pnpm', '--filter', '@scriptr/api', 'gen:types'],
    {
      cwd: REPO_DIR,
      env: { ...process.env, PROJECT_REF: ref },
      stdio: 'inherit',
    }
  )
  if (result.status !== 0) fail('`gen:types` failed')
  spawnSync('corepack', ['pnpm', 'format'], { cwd: REPO_DIR, stdio: 'inherit' })
}

const main = async () => {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fail(`No migrations directory at ${MIGRATIONS_DIR}`)
  }

  const ref = readLinkedProject()
  section(`◇ Linked project: ${ref}`)

  const list = supabase(['migration', 'list', '--linked'])
  if (list.status !== 0) {
    fail(
      `Could not read migration history:\n${list.stderr.trim() || list.stdout.trim()}`
    )
  }
  const { migrations } = parseJson<{ migrations: Array<MigrationRow> }>(
    list.stdout,
    'migration list'
  )

  const local = readLocalMigrations()
  const missingFiles = migrations.filter(
    (row) => row.local && !local.some((item) => item.version === row.local)
  )
  if (missingFiles.length > 0) {
    fail(
      `Remote history records migrations with no local file: ${missingFiles
        .map((row) => row.local)
        .join(
          ', '
        )}.\n  Run \`npx supabase migration fetch --linked\`, keep the new files, ` +
        'restore any it overwrote with `git checkout`, and re-run.'
    )
  }

  const pending = findPending(migrations, local)
  if (pending.length === 0) {
    console.log('✔ Remote database is up to date; nothing to apply.')
    return
  }

  section(`◇ ${pending.length} pending migration(s)`)
  for (const name of pending) console.log(`  • ${name}`)

  const destructive = scanDestructive(pending)
  if (destructive.length > 0) {
    section('✖ Destructive statements found')
    for (const hit of destructive) {
      console.log(`  ${hit.file}:${hit.line}  ${hit.label}\n    ${hit.text}`)
    }
    if (!allowDestructive) {
      fail(
        'Review these before applying, then re-run with --allow-destructive.'
      )
    }
    console.log('  --allow-destructive was passed, continuing.')
  }

  const uncommitted = findUncommitted(pending)
  if (uncommitted.length > 0) {
    section('✖ Pending migrations are not committed')
    for (const file of uncommitted) console.log(`  • ${file}`)
    if (!allowUncommitted) {
      fail(
        'Commit the migration files first so the repository and the remote history agree, ' +
          'or re-run with --allow-uncommitted.'
      )
    }
    console.log('  --allow-uncommitted was passed, continuing.')
  }

  if (!apply) {
    section('◇ Dry run (nothing was applied)')
    const preview = supabase(['db', 'push', '--linked', '--dry-run'])
    if (preview.status !== 0) {
      fail(`Dry run failed:\n${preview.stderr.trim() || preview.stdout.trim()}`)
    }
    console.log(preview.stdout.trim())
    console.log(
      '\nRe-run with --apply to push these migrations and regenerate the types.'
    )
    return
  }

  section('◇ Applying migrations')
  runOrFail(['db', 'push', '--linked', '--yes'], '`db push`')

  if (!skipTypes) regenerateTypes(ref)
  else console.log('\n◇ Skipped type generation (--skip-types)')

  const after = supabase(['migration', 'list', '--linked'])
  if (after.status === 0) {
    const remaining = findPending(
      parseJson<{ migrations: Array<MigrationRow> }>(
        after.stdout,
        'migration list'
      ).migrations,
      readLocalMigrations()
    )
    if (remaining.length > 0) {
      fail(`Still pending after the push: ${remaining.join(', ')}`)
    }
  }

  if (!skipTypes) {
    const types = git(['status', '--porcelain', '--', TYPES_FILE])
    if (types.stdout.trim()) {
      console.log('\n◇ Supabase types changed:')
      console.log(`  ${path.relative(REPO_DIR, TYPES_FILE)}`)
      console.log(
        '  Run `corepack pnpm check-types` and update the code that uses the new schema.'
      )
    }
  }

  await revalidatePublicPages()

  console.log('\n✔ Migrations applied and types regenerated.')
}

main()
