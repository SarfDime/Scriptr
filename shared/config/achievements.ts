import { ACHIEVEMENTS_STRINGS_PACK } from '../strings/achievements-strings'
import type { LocalizedText } from '../types/localization.types'
import { resolveLocalizedText } from '../utils/localized-strings'
import { DEFAULT_LOCALE, type LocaleId } from './localization-constants'

/**
 * Achievement metrics, rarity tiers and display copy shared by the API and the
 * frontend.
 *
 * Metrics are code-bound (each one has a calculator in
 * hono/src/lib/achievements.ts that queries a different table), so this list
 * has to be extended by hand when a metric is added — unlike achievement
 * *definitions*, which are a plain data insert (see
 * docs/ARCHITECTURE-USERS-AUTH.md).
 *
 * Rarities are ordered: index 0 is the lowest tier. The DB CHECK on
 * `achievement_definitions.rarity` guards the same set of values.
 */
export const ACHIEVEMENT_METRICS = [
  'scripts_uploaded',
  'comments_posted',
  'total_script_votes',
  'total_script_downloads',
] as const

export const ACHIEVEMENT_RARITIES = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
] as const

export type AchievementMetric = (typeof ACHIEVEMENT_METRICS)[number]
export type AchievementRarity = (typeof ACHIEVEMENT_RARITIES)[number]

export const isAchievementMetric = (
  value: string
): value is AchievementMetric =>
  (ACHIEVEMENT_METRICS as ReadonlyArray<string>).includes(value)

export const isAchievementRarity = (
  value: string
): value is AchievementRarity =>
  (ACHIEVEMENT_RARITIES as ReadonlyArray<string>).includes(value)

/**
 * Display copy for the seeded achievements, keyed by
 * `achievement_definitions.id`.
 *
 * The wording lives in `ACHIEVEMENTS_STRINGS_PACK.copy`
 * (`shared/strings/achievements-strings.ts`) so a wording change still reaches
 * the badge, the admin list and the notification at once, and so the badge and
 * the notification can read it in the reader's language. This export is the
 * English view, for the call sites that have no reader: the API and the admin
 * screens. Metric, threshold and rarity stay in the database — the award helper
 * and the admin editor both need them as data.
 *
 * Definitions created later through the admin screen have no entry here and
 * fall back to the row they were saved with — see `getAchievementCopy`.
 */
type AchievementCopyEntry = {
  title: LocalizedText
  description: LocalizedText
}

const CATALOGUE = ACHIEVEMENTS_STRINGS_PACK.copy as Record<
  string,
  AchievementCopyEntry
>

export const ACHIEVEMENT_COPY: Record<
  string,
  { title: string; description: string }
> = Object.fromEntries(
  Object.entries(CATALOGUE).map(([id, copy]) => [
    id,
    {
      title: resolveLocalizedText(copy.title, DEFAULT_LOCALE),
      description: resolveLocalizedText(copy.description, DEFAULT_LOCALE),
    },
  ])
)

/** Whether the catalogue has wording for an id — i.e. whether its badge and its
 * notification can be spelled out in the reader's language rather than falling
 * back to whatever the row was saved with. */
export const hasAchievementCopy = (id: string): boolean => id in CATALOGUE

/** Copy stored on the definition row, used when the id has no code entry. */
type StoredAchievementCopy = {
  title?: string | null
  description?: string | null
}

/**
 * The copy to show for an achievement: the catalogue entry when there is one,
 * otherwise whatever the row was saved with. `id` itself is the last resort so
 * an unknown achievement still renders something readable.
 */
export const getAchievementCopy = (
  id: string,
  stored?: StoredAchievementCopy | null,
  locale: LocaleId = DEFAULT_LOCALE
): { title: string; description: string | null } => {
  const entry = CATALOGUE[id]
  if (!entry) {
    return {
      title: stored?.title ?? id,
      description: stored?.description ?? null,
    }
  }
  return {
    title: resolveLocalizedText(entry.title, locale),
    description: resolveLocalizedText(entry.description, locale),
  }
}
