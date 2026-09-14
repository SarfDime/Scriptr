import type { Context } from 'hono'
import type { HonoEnv } from '../types/env.types'
import { createInternalSupabaseClient } from './supabase'

// Metric calculators below are code-bound (each queries a different table), so this
// union has to be extended by hand when a new metric is added — unlike achievement
// *definitions*, which are a plain data insert (see ARCHITECTURE.md §4).
type AchievementMetric =
  | 'scripts_uploaded'
  | 'comments_posted'
  | 'total_script_votes'
  | 'total_script_downloads'

/**
 * Checks a profile's current value for a metric against every achievement_definitions
 * row using that metric, awarding (profile_achievements) and notifying (notifications)
 * for any newly-crossed threshold. Both tables are is_admin()-gated in RLS, so this
 * always runs on the service-role client regardless of who triggered the mutation.
 *
 * Best-effort: never throws. This is a side effect of another mutation (vote, download,
 * comment, script upload) and must never fail the request that triggered it.
 */
export async function checkAndAwardAchievements(
  c: Context<HonoEnv>,
  profileId: string,
  metric: AchievementMetric,
  currentValue: number
) {
  try {
    const supabase = createInternalSupabaseClient(c)

    const { data: qualifying, error: definitionsError } = await supabase
      .from('achievement_definitions')
      .select('id, title, description')
      .eq('metric', metric)
      .lte('threshold', currentValue)

    if (definitionsError || !qualifying || qualifying.length === 0) return

    const { data: alreadyEarned } = await supabase
      .from('profile_achievements')
      .select('achievement_id')
      .eq('profile_id', profileId)
      .in(
        'achievement_id',
        qualifying.map((definition) => definition.id)
      )

    const earnedIds = new Set(
      (alreadyEarned ?? []).map((row) => row.achievement_id)
    )
    const newlyQualifying = qualifying.filter(
      (definition) => !earnedIds.has(definition.id)
    )

    for (const definition of newlyQualifying) {
      const { error: insertError } = await supabase
        .from('profile_achievements')
        .insert({ profile_id: profileId, achievement_id: definition.id })

      // A concurrent request may have inserted it first (unique constraint) — skip the
      // notification rather than double-notify.
      if (insertError) continue

      await supabase.from('notifications').insert({
        profile_id: profileId,
        type: 'achievement_earned',
        title: `Achievement unlocked: ${definition.title}`,
        body: definition.description,
        data: { achievement_id: definition.id },
      })
    }
  } catch {
    // Award-checking is a side effect — never let it fail the mutation that triggered it.
  }
}

/** scripts_uploaded — credited to the script's author */
export async function checkScriptsUploaded(
  c: Context<HonoEnv>,
  authorId: string
) {
  const supabase = createInternalSupabaseClient(c)
  const { count } = await supabase
    .from('scripts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', authorId)

  await checkAndAwardAchievements(c, authorId, 'scripts_uploaded', count ?? 0)
}

/** comments_posted — credited to the comment/reply's author (both live in `comments`) */
export async function checkCommentsPosted(
  c: Context<HonoEnv>,
  authorId: string
) {
  const supabase = createInternalSupabaseClient(c)
  const { count } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', authorId)

  await checkAndAwardAchievements(c, authorId, 'comments_posted', count ?? 0)
}

/** total_script_votes — credited to the voted-on script's author, not the voter */
export async function checkTotalScriptVotes(
  c: Context<HonoEnv>,
  scriptAuthorId: string
) {
  const supabase = createInternalSupabaseClient(c)
  const { data } = await supabase
    .from('scripts')
    .select('vote_score')
    .eq('author_id', scriptAuthorId)

  const total = (data ?? []).reduce(
    (sum, script) => sum + (script.vote_score ?? 0),
    0
  )
  await checkAndAwardAchievements(
    c,
    scriptAuthorId,
    'total_script_votes',
    total
  )
}

/** total_script_downloads — not currently seeded, but wired in per the roadmap; a no-op until an achievement_definitions row uses this metric */
export async function checkTotalScriptDownloads(
  c: Context<HonoEnv>,
  scriptAuthorId: string
) {
  const supabase = createInternalSupabaseClient(c)
  const { data } = await supabase
    .from('scripts')
    .select('download_count')
    .eq('author_id', scriptAuthorId)

  const total = (data ?? []).reduce(
    (sum, script) => sum + (script.download_count ?? 0),
    0
  )
  await checkAndAwardAchievements(
    c,
    scriptAuthorId,
    'total_script_downloads',
    total
  )
}
