/** biome-ignore-all lint/suspicious/noConsole: a CLI script reports its progress on the terminal. */

/**
 * Rewrites the placeholder slugs the `add_script_slug` migration left on
 * existing scripts (`script-<id8>`) with slugs built from their titles, using
 * the same function the API mints new scripts with.
 *
 * Dry run by default:
 *
 *   corepack pnpm backfill:script-slugs            # report only
 *   corepack pnpm backfill:script-slugs -- --apply # write
 *
 * Idempotent: it only touches rows whose slug is missing or still the
 * placeholder, so running it after a partial run picks up where it stopped.
 * Titles are Portable Text, folded to ASCII by `slugifyTitle`; a title that
 * keeps nothing usable stays on the `script-<id8>` form, which is unique and
 * stable even if it reads poorly.
 */

import { createClient } from '@supabase/supabase-js'
import { DEFAULT_LOCALE } from '../../shared/config/localization-constants'
import type { Json } from '../../shared/types/database.types'
import { pickLocalizedPortableText } from '../../shared/utils/localized-portable-text'
import { portableTextToPlainText } from '../../shared/utils/portable-text.utils'
import { buildScriptSlug, slugifyTitle } from '../../shared/utils/slug.utils'

const PLACEHOLDER = /^script-[0-9a-f]{8}$/
const PAGE_SIZE = 500

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

type ScriptRow = { id: string; title: Json; slug: string | null }

const readScripts = async (): Promise<Array<ScriptRow>> => {
  const rows: Array<ScriptRow> = []

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('scripts')
      .select('id, title, slug')
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
  const stale = scripts.filter(
    (script) => !script.slug || PLACEHOLDER.test(script.slug)
  )

  console.log(
    `\n${scripts.length} scripts, ${stale.length} on a placeholder or missing a slug.`
  )

  const pending = stale
    .map((script) => {
      // The title may be the old bare value or the localized map; the slug is
      // built from what a reader of the default language would see.
      const title = portableTextToPlainText(
        pickLocalizedPortableText(
          script.title as Parameters<typeof pickLocalizedPortableText>[0],
          DEFAULT_LOCALE
        ) ?? undefined
      )

      return {
        id: script.id,
        title,
        slug: buildScriptSlug(title, script.id),
      }
    })
    .filter(({ title, slug }) => slug !== `script-${title}`)

  const renamed = pending.filter(
    ({ slug }) => !PLACEHOLDER.test(slug) || slugifyTitle(slug) !== ''
  )

  for (const { title, slug } of renamed.slice(0, 10)) {
    console.log(`  ${title.slice(0, 60) || '(no title)'} → ${slug}`)
  }
  if (renamed.length > 10) console.log(`  … and ${renamed.length - 10} more`)

  if (!apply) {
    console.log(
      `\nDry run. Re-run with --apply to write ${renamed.length} slugs.\n`
    )
    return
  }

  for (const { id, slug } of renamed) {
    const { error } = await supabase
      .from('scripts')
      .update({ slug })
      .eq('id', id)

    if (error) {
      console.error(`\n✖ Updating ${id} failed: ${error.message}\n`)
      process.exit(1)
    }
  }

  console.log(`\n✔ Wrote ${renamed.length} slugs.\n`)
}

await main()
