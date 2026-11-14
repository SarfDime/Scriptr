/** biome-ignore-all lint/suspicious/noConsole: a CLI script reports its progress on the terminal. */

/**
 * Wraps every script's single Portable Text `title`/`description` in the
 * per-language shape the API now writes, so no stored row is left in the
 * pre-localization form.
 *
 * The language is the one the text is written in: Cyrillic → `mk`, anything
 * else → `en`. That only decides which tab the author finds the text on when
 * they open the editor — every reader falls back to whichever language is
 * filled (`pickLocalizedPortableText`), so the guess can be corrected later
 * without changing what anyone sees.
 *
 * Dry run by default:
 *
 *   corepack pnpm backfill:script-locales            # report only
 *   corepack pnpm backfill:script-locales -- --apply # write
 *
 * Idempotent: a value that is already an object keyed by language is left
 * alone, so a re-run after a partial run is a no-op.
 */

import { createClient } from '@supabase/supabase-js'
import type { LocaleId } from '../../shared/config/localization-constants'
import type { Json } from '../../shared/types/database.types'
import type { PortableTextValue } from '../../shared/types/portable-text.types'
import type { LocalizedScriptText } from '../../shared/types/scripts.types'
import { portableTextToPlainText } from '../../shared/utils/portable-text.utils'

/** The legacy shape, narrowed for the plain-text read. */
const asPortableText = (value: Json): PortableTextValue | undefined =>
  Array.isArray(value) ? (value as PortableTextValue) : undefined

const PAGE_SIZE = 500
const CYRILLIC = /[\u0400-\u04FF]/

const apply = process.argv.includes('--apply')

const url = process.env.SUPABASE_URL
const secretKey = process.env.SUPABASE_SECRET_KEY

if (!url || !secretKey) {
  console.error(
    '\n✖ SUPABASE_URL and SUPABASE_SECRET_KEY must be set (run with --env-file=.env).\n'
  )
  process.exit(1)
}

const supabase = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

type ScriptRow = { id: string; title: Json; description: Json | null }

/** The language a legacy value is written in. */
const languageOf = (value: Json): LocaleId =>
  CYRILLIC.test(portableTextToPlainText(asPortableText(value))) ? 'mk' : 'en'

/** A legacy bare Portable Text value becomes a one-language map; anything that
 *  is already a map (or empty) is returned untouched. */
const wrap = (value: Json): { next: Json; changed: boolean } => {
  if (value === null) return { next: null, changed: false }
  if (!Array.isArray(value)) return { next: value, changed: false }
  if (value.length === 0) return { next: {}, changed: false }

  const localized: LocalizedScriptText = { [languageOf(value)]: value }
  return { next: localized as Json, changed: true }
}

const readScripts = async (): Promise<Array<ScriptRow>> => {
  const rows: Array<ScriptRow> = []

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('scripts')
      .select('id, title, description')
      .order('created_at', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) {
      console.error(`\n✖ Reading scripts failed: ${error.message}\n`)
      process.exit(1)
    }

    rows.push(...((data ?? []) as Array<ScriptRow>))
    if (!data || data.length < PAGE_SIZE) return rows
  }
}

const main = async () => {
  const scripts = await readScripts()
  const pending = scripts.flatMap((script) => {
    const title = wrap(script.title)
    const description = wrap(script.description)
    if (!title.changed && !description.changed) return []

    return [
      {
        id: script.id,
        patch: {
          ...(title.changed ? { title: title.next } : {}),
          ...(description.changed ? { description: description.next } : {}),
        },
        language: languageOf(script.title),
        sample: portableTextToPlainText(asPortableText(script.title)).slice(
          0,
          60
        ),
      },
    ]
  })

  const byLanguage = pending.reduce<Record<string, number>>((counts, row) => {
    counts[row.language] = (counts[row.language] ?? 0) + 1
    return counts
  }, {})

  console.log(
    `\n${scripts.length} scripts, ${pending.length} in the pre-localization shape.`
  )
  console.log(
    `Languages guessed: ${
      Object.entries(byLanguage)
        .map(([language, count]) => `${language} ${count}`)
        .join(', ') || 'none'
    }\n`
  )

  for (const row of pending.slice(0, 10)) {
    console.log(`  [${row.language}] ${row.sample || '(no title)'}`)
  }
  if (pending.length > 10) console.log(`  … and ${pending.length - 10} more`)

  if (!apply) {
    console.log('\nDry run. Re-run with --apply to write.\n')
    return
  }

  for (const row of pending) {
    const { error } = await supabase
      .from('scripts')
      .update(row.patch)
      .eq('id', row.id)

    if (error) {
      console.error(`\n✖ Updating ${row.id} failed: ${error.message}\n`)
      process.exit(1)
    }
  }

  console.log(`\n✔ Wrapped ${pending.length} scripts.\n`)
}

await main()
