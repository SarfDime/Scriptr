import type { Context } from 'hono'
import {
  type AchievementMetric,
  getAchievementCopy,
} from '../../../shared/config/achievements'
import { DEFAULT_PROFILE_PREFERENCES } from '../../../shared/config/profile-preferences'
import { NOTIFICATION_ROW_STRINGS } from '../../../shared/strings/notifications-strings'
import type { HonoEnv } from '../types/env.types'
import { honoLog } from './logger'
import { insertNotificationBestEffort } from './notifications'
import { readStoredProfilePreferences } from './profile-preferences'
import { createInternalSupabaseClient } from './supabase'

type AwardableDefinition = {
  id: string
  threshold: number
  study_id: string | null
}

/**
 * The definitions this mutation crosses. A global definition (`study_id` null)
 * is measured across the platform, a study definition inside its study, and a
 * definition belonging to another study never qualifies here — a vote in one
 * study is not evidence of progress in another.
 */
export const selectQualifyingDefinitions = <T extends AwardableDefinition>(
  definitions: ReadonlyArray<T>,
  values: { studyId: string | null; global: number; scoped: number }
): Array<T> =>
  definitions.filter((definition) => {
    if (definition.study_id === null) {
      return definition.threshold <= values.global
    }
    return (
      definition.study_id === values.studyId &&
      definition.threshold <= values.scoped
    )
  })

/**
 * Checks a profile's current value for a metric against the achievement
 * definitions that can apply to it, awarding (`profile_achievements`) and
 * notifying (`notifications`) for any newly-crossed threshold. The notification
 * respects the recipient's achievement preference; awarding never does.
 *
 * Definitions are either global (`study_id` null, counted across every study) or
 * scoped to one study (counted inside it). A trigger that fires in a study
 * therefore evaluates both groups — against the value for their own scope, so a
 * global "10 scripts uploaded" still means ten anywhere, and a study's "5 in
 * this study" means five here.
 *
 * The value is a thunk so the definitions load first: a metric with no
 * definitions returns early and never pays for the (often author-wide) value
 * query, and each scope only runs its own query when it has definitions.
 *
 * Best-effort: never throws. This is a side effect of another mutation (vote,
 * download, comment, script upload) and must never fail the request.
 */
export async function checkAndAwardAchievements(
  c: Context<HonoEnv>,
  profileId: string,
  metric: AchievementMetric,
  /** The metric's value, scoped to one study or (`null`) to the whole platform. */
  getCurrentValue: (studyId: string | null) => Promise<number>,
  /** The study the triggering row belongs to, if any. */
  studyId: string | null
) {
  try {
    const supabase = createInternalSupabaseClient(c)

    const { data: definitions, error: definitionsError } = await supabase
      .from('achievement_definitions')
      .select('id, title, description, threshold, study_id')
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

    const scoped = studyId
      ? definitions.filter((definition) => definition.study_id === studyId)
      : []
    const global = definitions.filter(
      (definition) => definition.study_id === null
    )
    if (scoped.length === 0 && global.length === 0) return

    const [scopedValue, globalValue] = await Promise.all([
      scoped.length > 0 ? getCurrentValue(studyId) : Promise.resolve(0),
      global.length > 0 ? getCurrentValue(null) : Promise.resolve(0),
    ])
    const qualifying = selectQualifyingDefinitions(definitions, {
      studyId,
      global: globalValue,
      scoped: scopedValue,
    })
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
          title: NOTIFICATION_ROW_STRINGS.achievementTitle(copy.title),
          body: copy.description,
          data: { achievement_id: definition.id },
          studyId: definition.study_id,
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
  authorId: string,
  studyId: string | null
) {
  await checkAndAwardAchievements(
    c,
    authorId,
    'scripts_uploaded',
    async (scope) => {
      let query = createInternalSupabaseClient(c)
        .from('scripts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', authorId)
      if (scope) query = query.eq('study_id', scope)
      const { count } = await query
      return count ?? 0
    },
    studyId
  )
}

/** comments_posted — credited to the comment/reply's author (both live in
 * `comments`). A comment belongs to a study through its script; a comment on a
 * professor has no script, so it only counts towards the global definitions. */
export async function checkCommentsPosted(
  c: Context<HonoEnv>,
  authorId: string,
  studyId: string | null
) {
  await checkAndAwardAchievements(
    c,
    authorId,
    'comments_posted',
    async (scope) => {
      const supabase = createInternalSupabaseClient(c)
      if (!scope) {
        const { count } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', authorId)
        return count ?? 0
      }

      const { count } = await supabase
        .from('comments')
        .select('script:scripts!inner(study_id)', {
          count: 'exact',
          head: true,
        })
        .eq('author_id', authorId)
        .eq('script.study_id', scope)
      return count ?? 0
    },
    studyId
  )
}

/** The author's votes summed over their scripts, in one study or in all. */
const sumScriptMetric = async (
  c: Context<HonoEnv>,
  authorId: string,
  studyId: string | null,
  column: 'vote_score' | 'download_count'
): Promise<number> => {
  let query = createInternalSupabaseClient(c)
    .from('scripts')
    .select(column)
    .eq('author_id', authorId)
  if (studyId) query = query.eq('study_id', studyId)

  const { data } = await query
  return (data ?? []).reduce((sum, script) => {
    const value =
      'vote_score' in script ? script.vote_score : script.download_count
    return sum + (Number(value) || 0)
  }, 0)
}

/** total_script_votes — credited to the voted-on script's author, not the voter */
export async function checkTotalScriptVotes(
  c: Context<HonoEnv>,
  scriptAuthorId: string,
  studyId: string | null
) {
  await checkAndAwardAchievements(
    c,
    scriptAuthorId,
    'total_script_votes',
    (scope) => sumScriptMetric(c, scriptAuthorId, scope, 'vote_score'),
    studyId
  )
}

/** total_script_downloads — not currently seeded, but wired in per the roadmap; a no-op until an achievement_definitions row uses this metric */
export async function checkTotalScriptDownloads(
  c: Context<HonoEnv>,
  scriptAuthorId: string,
  studyId: string | null
) {
  await checkAndAwardAchievements(
    c,
    scriptAuthorId,
    'total_script_downloads',
    (scope) => sumScriptMetric(c, scriptAuthorId, scope, 'download_count'),
    studyId
  )
}
