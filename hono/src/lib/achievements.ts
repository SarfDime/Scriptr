import type { Context } from 'hono'
import {
  type AchievementMetric,
  getAchievementCopy,
} from '../../../shared/config/achievements'
import { DEFAULT_PROFILE_PREFERENCES } from '../../../shared/config/profile-preferences'
import { NOTIFICATIONS_STRINGS } from '../../../shared/strings/notifications-strings'
import type { HonoEnv } from '../types/env.types'
import { honoLog } from './logger'
import { insertNotificationBestEffort } from './notifications'
import { readStoredProfilePreferences } from './profile-preferences'
import { createInternalSupabaseClient } from './supabase'

/**
 * Checks a profile's current value for a metric against every achievement_definitions
 * row using that metric, awarding (profile_achievements) and notifying (notifications)
 * for any newly-crossed threshold. The notification respects the recipient's
 * achievement preference; awarding never does.
 *
 * The value is a thunk so the definitions load first: a metric with no definitions
 * returns early and never pays for the (often author-wide) value query.
 *
 * Best-effort: never throws. This is a side effect of another mutation (vote, download,
 * comment, script upload) and must never fail the request that triggered it.
 */
export async function checkAndAwardAchievements(
  c: Context<HonoEnv>,
  profileId: string,
  metric: AchievementMetric,
  getCurrentValue: () => Promise<number>
) {
  try {
    const supabase = createInternalSupabaseClient(c)

    const { data: definitions, error: definitionsError } = await supabase
      .from('achievement_definitions')
      .select('id, title, description, threshold')
      .eq('metric', metric)

    if (definitionsError) {
      honoLog({
        logLevel: 'error',
        message: 'Failed to load achievement definitions',
        error: definitionsError,
      })
      return
    }
    if (!definitions || definitions.length === 0) return

    const currentValue = await getCurrentValue()
    const qualifying = definitions.filter(
      (definition) => definition.threshold <= currentValue
    )
    if (qualifying.length === 0) return

    const { data: alreadyEarned, error: earnedError } = await supabase
      .from('profile_achievements')
      .select('achievement_id')
      .eq('profile_id', profileId)
      .in(
        'achievement_id',
        qualifying.map((definition) => definition.id)
      )

    if (earnedError) {
      honoLog({
        logLevel: 'error',
        message: 'Failed to load earned achievements',
        error: earnedError,
      })
      return
    }

    const earnedIds = new Set(
      (alreadyEarned ?? []).map((row) => row.achievement_id)
    )
    const newlyQualifying = qualifying.filter(
      (definition) => !earnedIds.has(definition.id)
    )
    if (newlyQualifying.length === 0) return

    const { data: preferenceRow, error: preferenceError } = await supabase
      .from('profile_preferences')
      .select('preferences')
      .eq('profile_id', profileId)
      .maybeSingle()
    let shouldNotify = preferenceError === null
    if (preferenceError) {
      honoLog({
        logLevel: 'error',
        message: 'Failed to load achievement notification preferences',
        error: preferenceError,
      })
    } else if (preferenceRow) {
      const preferences = readStoredProfilePreferences(
        preferenceRow.preferences
      )
      if (!preferences) {
        shouldNotify = false
        honoLog({
          logLevel: 'error',
          message: 'Stored profile notification preferences are invalid',
          error: new Error('Invalid profile preference value'),
        })
      } else {
        const achievementPreference =
          'notifications' in preferences
            ? preferences.notifications.achievements
            : DEFAULT_PROFILE_PREFERENCES.notifications.achievements
        shouldNotify = achievementPreference === 'show'
      }
    } else {
      shouldNotify =
        DEFAULT_PROFILE_PREFERENCES.notifications.achievements === 'show'
    }

    for (const definition of newlyQualifying) {
      const { error: insertError } = await supabase
        .from('profile_achievements')
        .insert({ profile_id: profileId, achievement_id: definition.id })

      if (insertError) {
        if (insertError.code !== '23505') {
          honoLog({
            logLevel: 'error',
            message: 'Failed to award achievement',
            error: insertError,
          })
        }
        continue
      }

      if (shouldNotify) {
        // Copy comes from the shared catalogue, so a wording change applies to
        // the badge, the admin list and this notification at once.
        const copy = getAchievementCopy(definition.id, definition)
        await insertNotificationBestEffort(supabase, profileId, {
          type: 'achievement_earned',
          title: NOTIFICATIONS_STRINGS.achievementTitle(copy.title),
          body: copy.description,
          data: { achievement_id: definition.id },
        })
      }
    }
  } catch (error) {
    honoLog({
      logLevel: 'error',
      message: 'Achievement side effect failed',
      error,
    })
  }
}

/** scripts_uploaded — credited to the script's author */
export async function checkScriptsUploaded(
  c: Context<HonoEnv>,
  authorId: string
) {
  await checkAndAwardAchievements(c, authorId, 'scripts_uploaded', async () => {
    const { count } = await createInternalSupabaseClient(c)
      .from('scripts')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', authorId)
    return count ?? 0
  })
}

/** comments_posted — credited to the comment/reply's author (both live in `comments`) */
export async function checkCommentsPosted(
  c: Context<HonoEnv>,
  authorId: string
) {
  await checkAndAwardAchievements(c, authorId, 'comments_posted', async () => {
    const { count } = await createInternalSupabaseClient(c)
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', authorId)
    return count ?? 0
  })
}

/** total_script_votes — credited to the voted-on script's author, not the voter */
export async function checkTotalScriptVotes(
  c: Context<HonoEnv>,
  scriptAuthorId: string
) {
  await checkAndAwardAchievements(
    c,
    scriptAuthorId,
    'total_script_votes',
    async () => {
      const { data } = await createInternalSupabaseClient(c)
        .from('scripts')
        .select('vote_score')
        .eq('author_id', scriptAuthorId)
      return (data ?? []).reduce(
        (sum, script) => sum + (script.vote_score ?? 0),
        0
      )
    }
  )
}

/** total_script_downloads — not currently seeded, but wired in per the roadmap; a no-op until an achievement_definitions row uses this metric */
export async function checkTotalScriptDownloads(
  c: Context<HonoEnv>,
  scriptAuthorId: string
) {
  await checkAndAwardAchievements(
    c,
    scriptAuthorId,
    'total_script_downloads',
    async () => {
      const { data } = await createInternalSupabaseClient(c)
        .from('scripts')
        .select('download_count')
        .eq('author_id', scriptAuthorId)
      return (data ?? []).reduce(
        (sum, script) => sum + (script.download_count ?? 0),
        0
      )
    }
  )
}
